-- EduGo: esquema de Supabase.
-- Ejecútalo entero en el SQL Editor de Supabase. Se puede volver a ejecutar sin perder datos.
-- El PIN del profesor no se guarda aquí, porque este repositorio es público. Para fijarlo o cambiarlo, ejecuta aparte:
--   select privado.establecer_pin_docente('TU_PIN');

create extension if not exists pgcrypto with schema extensions;

-- Los datos privados viven en un esquema que la API de Supabase no expone:
-- solo se puede llegar a ellos a través de las funciones públicas de abajo.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.alumnos (
  id bigint generated always as identity primary key,
  alias text not null check (char_length(alias) between 1 and 30),
  pin_hash text not null,
  creado timestamptz not null default now()
);
create unique index if not exists alumnos_alias_unico on privado.alumnos (lower(alias));

create table if not exists privado.resultados (
  id uuid primary key,
  alumno_id bigint not null references privado.alumnos (id) on delete cascade,
  leccion text not null,
  puntos int not null,
  total int not null,
  fecha timestamptz not null,
  check (total > 0 and puntos between 0 and total)
);

create table if not exists privado.docente (
  unica boolean primary key default true check (unica),
  pin_hash text not null
);

create table if not exists privado.intentos_pin (
  clave text primary key,
  fallos int not null default 0,
  bloqueado_hasta timestamptz
);

-- Las lecciones son públicas para leer; solo se escriben con docente_guardar_leccion.
-- Las de src/data/lecciones.json no hace falta copiarlas: si el profesor edita una,
-- se guarda aquí con el mismo id y sustituye a la original.
create table if not exists public.lecciones (
  id text primary key,
  asignatura text not null,
  titulo text not null,
  texto text not null,
  preguntas jsonb not null,
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);
alter table public.lecciones enable row level security;
revoke all on public.lecciones from anon, authenticated;
grant select on public.lecciones to anon, authenticated;
drop policy if exists "lecciones visibles" on public.lecciones;
create policy "lecciones visibles" on public.lecciones for select to anon, authenticated using (true);

-- Comprueba un PIN con límite de intentos: 5 fallos bloquean esa clave 15 minutos.
-- Devuelve 'ok', 'bloqueado' o 'credenciales'. Las funciones públicas devuelven el fallo
-- como valor (no con una excepción) para que el contador de fallos quede guardado.
create or replace function privado.comprobar_pin(p_clave text, p_hash text, p_pin text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_intento privado.intentos_pin;
begin
  select * into v_intento from privado.intentos_pin where clave = p_clave;
  if v_intento.bloqueado_hasta > now() then
    return 'bloqueado';
  end if;

  if p_hash is not null and p_pin is not null and extensions.crypt(p_pin, p_hash) = p_hash then
    delete from privado.intentos_pin where clave = p_clave;
    return 'ok';
  end if;

  insert into privado.intentos_pin (clave, fallos) values (p_clave, 1)
  on conflict (clave) do update set
    fallos = case when excluded.fallos + privado.intentos_pin.fallos >= 5 then 0
                  else privado.intentos_pin.fallos + 1 end,
    bloqueado_hasta = case when excluded.fallos + privado.intentos_pin.fallos >= 5
                           then now() + interval '15 minutes' end;
  return 'credenciales';
end;
$$;

create or replace function privado.establecer_pin_docente(p_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_pin !~ '^[0-9]{4,12}$' then
    raise exception 'El PIN del profesor debe tener entre 4 y 12 dígitos';
  end if;
  insert into privado.docente (pin_hash) values (extensions.crypt(p_pin, extensions.gen_salt('bf', 8)))
  on conflict (unica) do update set pin_hash = excluded.pin_hash;
  delete from privado.intentos_pin where clave = 'docente';
end;
$$;

create or replace function privado.comprobar_docente(p_pin text)
returns text language sql security definer set search_path = '' as $$
  select privado.comprobar_pin('docente', (select pin_hash from privado.docente), p_pin);
$$;

-- Registra o identifica a un alumno y guarda sus resultados pendientes.
-- p_crear = true crea la cuenta si el alias está libre. Reenviar un resultado no lo duplica.
create or replace function public.alumno_sincronizar(p_alias text, p_pin text, p_resultados jsonb, p_crear boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_alias text := btrim(p_alias);
  v_id bigint;
  v_hash text;
  v_estado text;
begin
  if v_alias is null or char_length(v_alias) not between 1 and 30 or p_pin !~ '^[0-9]{4,8}$' then
    return jsonb_build_object('ok', false, 'motivo', 'credenciales');
  end if;

  select id, pin_hash into v_id, v_hash from privado.alumnos where lower(alias) = lower(v_alias);

  if v_id is null then
    if not p_crear then
      return jsonb_build_object('ok', false, 'motivo', 'credenciales');
    end if;
    insert into privado.alumnos (alias, pin_hash)
    values (v_alias, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)))
    returning id into v_id;
  else
    v_estado := privado.comprobar_pin('alumno:' || lower(v_alias), v_hash, p_pin);
    if v_estado <> 'ok' then
      return jsonb_build_object('ok', false, 'motivo', v_estado);
    end if;
  end if;

  insert into privado.resultados (id, alumno_id, leccion, puntos, total, fecha)
  select r.id, v_id, r.leccion, r.puntos, r.total, r.fecha
  from jsonb_to_recordset(coalesce(p_resultados, '[]'::jsonb))
    as r(id uuid, leccion text, puntos int, total int, fecha timestamptz)
  on conflict (id) do nothing;

  return jsonb_build_object('ok', true, 'alias', (select alias from privado.alumnos where id = v_id));
end;
$$;

create or replace function public.docente_entrar(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_estado text := privado.comprobar_docente(p_pin);
begin
  if v_estado <> 'ok' then
    return jsonb_build_object('ok', false, 'motivo', v_estado);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.docente_resultados(p_pin text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_estado text := privado.comprobar_docente(p_pin);
begin
  if v_estado <> 'ok' then
    return jsonb_build_object('ok', false, 'motivo', v_estado);
  end if;
  return jsonb_build_object('ok', true, 'resultados', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'alias', a.alias, 'leccion', r.leccion,
      'puntos', r.puntos, 'total', r.total, 'fecha', r.fecha
    ) order by r.fecha desc)
    from privado.resultados r join privado.alumnos a on a.id = r.alumno_id
  ), '[]'::jsonb));
end;
$$;

-- Comprueba una tarea según su tipo: opciones (por defecto), emparejar, unir, ordenar o huecos.
create or replace function privado.tarea_valida(p jsonb)
returns boolean language plpgsql set search_path = '' as $$
declare
  v_tipo text := coalesce(p->>'tipo', 'opciones');
begin
  if jsonb_typeof(p) is distinct from 'object' or coalesce(btrim(p->>'pregunta'), '') = '' then
    return false;
  end if;

  if v_tipo = 'opciones' then
    if jsonb_typeof(p->'opciones') is distinct from 'array' or jsonb_array_length(p->'opciones') < 2
       or jsonb_typeof(p->'correcta') is distinct from 'number' or (p->>'correcta') !~ '^[0-9]+$'
       or (p->>'correcta')::int >= jsonb_array_length(p->'opciones') then
      return false;
    end if;
    return not exists (select 1 from jsonb_array_elements(p->'opciones') e where coalesce(btrim(e #>> '{}'), '') = '');
  elsif v_tipo in ('emparejar', 'unir') then
    if jsonb_typeof(p->'pares') is distinct from 'array' or jsonb_array_length(p->'pares') < 2 then
      return false;
    end if;
    return not exists (
      select 1 from jsonb_array_elements(p->'pares') e
      where coalesce(btrim(e->>'izquierda'), '') = '' or coalesce(btrim(e->>'derecha'), '') = ''
    );
  elsif v_tipo = 'ordenar' then
    if jsonb_typeof(p->'pasos') is distinct from 'array' or jsonb_array_length(p->'pasos') < 2 then
      return false;
    end if;
    return not exists (select 1 from jsonb_array_elements(p->'pasos') e where coalesce(btrim(e #>> '{}'), '') = '');
  elsif v_tipo = 'huecos' then
    if jsonb_typeof(p->'frase') is distinct from 'string' or jsonb_typeof(p->'respuestas') is distinct from 'array'
       or jsonb_array_length(p->'respuestas') < 1
       or array_length(regexp_split_to_array(p->>'frase', '_{3,}'), 1) - 1 <> jsonb_array_length(p->'respuestas') then
      return false;
    end if;
    return not exists (select 1 from jsonb_array_elements(p->'respuestas') e where coalesce(btrim(e #>> '{}'), '') = '');
  end if;
  return false;
end;
$$;

-- Crea la lección si el id es nuevo o la modifica (texto y tareas) si ya existe.
create or replace function public.docente_guardar_leccion(p_pin text, p_leccion jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_estado text := privado.comprobar_docente(p_pin);
  v_pregunta jsonb;
begin
  if v_estado <> 'ok' then
    return jsonb_build_object('ok', false, 'motivo', v_estado);
  end if;

  if coalesce(btrim(p_leccion->>'id'), '') = '' or coalesce(btrim(p_leccion->>'asignatura'), '') = ''
     or coalesce(btrim(p_leccion->>'titulo'), '') = '' or coalesce(btrim(p_leccion->>'texto'), '') = ''
     or jsonb_typeof(p_leccion->'preguntas') is distinct from 'array'
     or jsonb_array_length(p_leccion->'preguntas') = 0 then
    return jsonb_build_object('ok', false, 'motivo', 'leccion_invalida');
  end if;

  for v_pregunta in select * from jsonb_array_elements(p_leccion->'preguntas') loop
    if not privado.tarea_valida(v_pregunta) then
      return jsonb_build_object('ok', false, 'motivo', 'leccion_invalida');
    end if;
  end loop;

  insert into public.lecciones (id, asignatura, titulo, texto, preguntas)
  values (p_leccion->>'id', p_leccion->>'asignatura', p_leccion->>'titulo', p_leccion->>'texto', p_leccion->'preguntas')
  on conflict (id) do update set
    asignatura = excluded.asignatura,
    titulo = excluded.titulo,
    texto = excluded.texto,
    preguntas = excluded.preguntas,
    actualizada = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Permisos: la app (rol anon) solo puede llamar a estas cuatro funciones.
revoke all on all functions in schema privado from public, anon, authenticated;
revoke all on function public.alumno_sincronizar(text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.docente_entrar(text) from public, anon, authenticated;
revoke all on function public.docente_resultados(text) from public, anon, authenticated;
revoke all on function public.docente_guardar_leccion(text, jsonb) from public, anon, authenticated;
grant execute on function public.alumno_sincronizar(text, text, jsonb, boolean) to anon, authenticated;
grant execute on function public.docente_entrar(text) to anon, authenticated;
grant execute on function public.docente_resultados(text) to anon, authenticated;
grant execute on function public.docente_guardar_leccion(text, jsonb) to anon, authenticated;
