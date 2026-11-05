import leccionesBase from './contenido/lecciones.json'
import testsBase from './contenido/tests.json'
import { barajar, claveTarea, identidadTarea } from '../alumno/actividades'
import { t } from '../idiomas/i18n'
import { supabase } from './supabase'

function leer(clave, porDefecto) {
  return JSON.parse(localStorage.getItem(clave) || 'null') ?? porDefecto
}

function escribir(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

async function llamar(funcion, argumentos) {
  const { data, error } = await supabase.rpc(funcion, argumentos)
  if (error) throw error
  return data
}

function nuevoId() {
  // crypto.randomUUID solo existe en contextos seguros; esto funciona también en la app nativa.
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const normalizar = (alias) => alias.trim().toLowerCase()

function mensajeMotivo(motivo, credenciales) {
  if (motivo === 'bloqueado') return t('errBloqueo')
  return credenciales
}

// ---------- Cuentas de alumno guardadas en este móvil ----------

const leerCuentas = () => leer('cuentas', {})

function validarAlias(alias) {
  const limpio = alias.trim()
  if (limpio.length < 1 || limpio.length > 30) return t('errAliasLongitud')
  return null
}

export function cuentaActual() {
  return leerCuentas()[leer('sesion', null)] ?? null
}

function abrirSesion(cuenta) {
  const cuentas = leerCuentas()
  const clave = normalizar(cuenta.alias)
  cuentas[clave] = cuenta
  escribir('cuentas', cuentas)
  escribir('sesion', clave)
  localStorage.removeItem('alias') // Sustituido por las cuentas con PIN.
  return cuenta
}

export function cerrarSesion() {
  localStorage.removeItem('sesion')
}

export async function registrarAlumno(alias, pin) {
  const errorAlias = validarAlias(alias)
  if (errorAlias) return { error: errorAlias }
  if (!/^\d{4,8}$/.test(pin)) return { error: t('errPinLongitud') }
  const limpio = alias.trim()
  if (leerCuentas()[normalizar(limpio)]) return { error: t('errAliasEnMovil') }

  try {
    const r = await llamar('alumno_sincronizar', { p_alias: limpio, p_pin: pin, p_resultados: [], p_crear: true })
    if (!r.ok) return { error: mensajeMotivo(r.motivo, t('errAliasEnUso')) }
    return { cuenta: abrirSesion({ alias: r.alias, pin, sincronizada: true }) }
  } catch {
    // Sin servidor: la cuenta se crea en el móvil y se registra al sincronizar.
    return { cuenta: abrirSesion({ alias: limpio, pin, sincronizada: false }) }
  }
}

export async function entrarAlumno(alias, pin) {
  const local = leerCuentas()[normalizar(alias)]
  if (local) {
    return local.pin === pin ? { cuenta: abrirSesion(local) } : { error: t('errAliasPin') }
  }
  try {
    const r = await llamar('alumno_sincronizar', { p_alias: alias.trim(), p_pin: pin, p_resultados: [], p_crear: false })
    if (!r.ok) return { error: mensajeMotivo(r.motivo, t('errAliasPin')) }
    return { cuenta: abrirSesion({ alias: r.alias, pin, sincronizada: true }) }
  } catch {
    return { error: t('errPrimeraVez') }
  }
}

// Para cuentas creadas sin conexión cuyo alias resultó estar ocupado en el servidor.
export function cambiarAlias(cuenta, nuevoAlias) {
  const errorAlias = validarAlias(nuevoAlias)
  if (errorAlias) return { error: errorAlias }
  const limpio = nuevoAlias.trim()
  const cuentas = leerCuentas()
  if (cuentas[normalizar(limpio)]) return { error: t('errAliasRepetido') }

  const claveVieja = normalizar(cuenta.alias)
  escribir('resultados', leer('resultados', []).map((r) =>
    normalizar(r.alias) === claveVieja ? { ...r, alias: limpio } : r
  ))
  delete cuentas[claveVieja]
  escribir('cuentas', cuentas)
  for (const clave of ['fallos', 'preguntas_vistas', 'guardadas', 'apuntes']) {
    const porAlumno = leer(clave, {})
    if (porAlumno[claveVieja]) {
      porAlumno[normalizar(limpio)] = porAlumno[claveVieja]
      delete porAlumno[claveVieja]
      escribir(clave, porAlumno)
    }
  }
  return { cuenta: abrirSesion({ alias: limpio, pin: cuenta.pin, sincronizada: false }) }
}

// ---------- Resultados ----------

export function guardarResultado(resultado) {
  escribir('resultados', [...leer('resultados', []), { ...resultado, id: nuevoId(), enviado: false }])
}

export function contarPendientes(alias) {
  return leer('resultados', []).filter((r) => !r.enviado && normalizar(r.alias) === normalizar(alias)).length
}

export function resultadosDe(alias) {
  return leer('resultados', []).filter((r) => normalizar(r.alias) === normalizar(alias))
}

// ---------- Lecciones guardadas por cada alumno; solo en este dispositivo ----------

export function guardadasDe(alias) {
  return leer('guardadas', {})[normalizar(alias)] ?? []
}

export function alternarGuardada(alias, id) {
  const actuales = guardadasDe(alias)
  const nuevas = actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
  escribir('guardadas', { ...leer('guardadas', {}), [normalizar(alias)]: nuevas })
  return nuevas
}

// ---------- Calendario de exámenes y tareas de cada alumno; solo en este dispositivo ----------

export function apuntesDe(alias) {
  return leer('apuntes', {})[normalizar(alias)] ?? []
}

function escribirApuntes(alias, apuntes) {
  escribir('apuntes', { ...leer('apuntes', {}), [normalizar(alias)]: apuntes })
  return apuntes
}

export function guardarApunte(alias, apunte) {
  return escribirApuntes(alias, [...apuntesDe(alias), { ...apunte, id: nuevoId() }])
}

export function borrarApunte(alias, id) {
  return escribirApuntes(alias, apuntesDe(alias).filter((a) => a.id !== id))
}

// ---------- Refuerzo: por alumno y tarea, cuántos fallos quedan por compensar con aciertos ----------

export function registrarRespuesta(alias, clave, correcta) {
  const fallos = leer('fallos', {})
  const delAlumno = fallos[normalizar(alias)] ?? {}
  const saldo = (delAlumno[clave] ?? 0) + (correcta ? -1 : 1)
  if (saldo > 0) delAlumno[clave] = saldo
  else delete delAlumno[clave]
  escribir('fallos', { ...fallos, [normalizar(alias)]: delAlumno })
}

const MAX_REFUERZO = 10

// Las tareas que ya no existen (el profesor las cambió) quedan fuera por no estar en las lecciones.
export function tareasParaReforzar(alias, lecciones) {
  const delAlumno = leer('fallos', {})[normalizar(alias)] ?? {}
  return lecciones
    .flatMap((l) => l.preguntas.map((p) => {
      const clave = claveTarea(l.id, p)
      return { ...p, clave, asignatura: l.asignatura, saldo: delAlumno[clave] ?? 0 }
    }))
    .filter((t) => t.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, MAX_REFUERZO)
}

// ---------- Lecciones: las incluidas en la app más las del servidor, que tienen prioridad ----------

function leerContenido() {
  const incluido = [...leccionesBase, ...testsBase]
  const delServidor = leer('lecciones_servidor', [])
  const porId = new Map(delServidor.map((l) => [l.id, l]))
  const idsIncluidos = new Set(incluido.map((l) => l.id))
  return [...incluido.map((l) => porId.get(l.id) ?? l), ...delServidor.filter((l) => !idsIncluidos.has(l.id))]
}

// Los tests son independientes de las lecciones: comparten tabla y se distinguen por el id.
const PREFIJO_TEST = 'test-'
const esTest = (l) => l.id.startsWith(PREFIJO_TEST)

export const leerLecciones = () => leerContenido().filter((l) => !esTest(l))
export const leerTests = () => leerContenido().filter(esTest)

export const PREGUNTAS_POR_TEST = 10

// Elige las preguntas de un intento. Cada alumno recorre todo el banco antes de que se repita ninguna.
export function elegirPreguntasTest(alias, test) {
  const vistas = leer('preguntas_vistas', {})
  const delAlumno = vistas[normalizar(alias)] ?? {}
  const yaVistas = new Set(delAlumno[test.id] ?? [])
  const nuevas = barajar(test.preguntas.filter((p) => !yaVistas.has(identidadTarea(p))))
  const repetidas = barajar(test.preguntas.filter((p) => yaVistas.has(identidadTarea(p))))

  const elegidas = nuevas.slice(0, PREGUNTAS_POR_TEST)
  const faltan = PREGUNTAS_POR_TEST - elegidas.length
  const completado = faltan > 0
  elegidas.push(...repetidas.slice(0, faltan))

  // Al agotar el banco empieza otra vuelta, contando solo las de este intento.
  const textos = elegidas.map(identidadTarea)
  delAlumno[test.id] = completado ? textos : [...yaVistas, ...textos]
  escribir('preguntas_vistas', { ...vistas, [normalizar(alias)]: delAlumno })
  return barajar(elegidas)
}

async function actualizarLecciones() {
  const { data, error } = await supabase
    .from('lecciones')
    .select('id, asignatura, titulo, texto, preguntas')
    .order('creada')
  if (error) throw error
  escribir('lecciones_servidor', data)
}

// ---------- Sincronización ----------

async function subirResultados() {
  // Los resultados guardados por versiones anteriores de la app no tienen id.
  const todos = leer('resultados', [])
  if (todos.some((r) => !r.id)) {
    escribir('resultados', todos.map((r) => (r.id ? r : { ...r, id: nuevoId() })))
  }

  for (const [clave, cuenta] of Object.entries(leerCuentas())) {
    if (cuenta.conflicto) continue
    const pendientes = leer('resultados', []).filter((r) => !r.enviado && normalizar(r.alias) === clave)
    if (pendientes.length === 0 && cuenta.sincronizada) continue

    const r = await llamar('alumno_sincronizar', {
      p_alias: cuenta.alias,
      p_pin: cuenta.pin,
      p_resultados: pendientes.map(({ id, leccion, puntos, total, fecha }) => ({ id, leccion, puntos, total, fecha })),
      p_crear: true,
    })

    const cuentas = leerCuentas()
    if (r.ok) {
      cuentas[clave] = { ...cuenta, sincronizada: true }
      const enviados = new Set(pendientes.map((p) => p.id))
      // Se relee para no perder un resultado guardado mientras se enviaba este lote.
      escribir('resultados', leer('resultados', []).map((x) => (enviados.has(x.id) ? { ...x, enviado: true } : x)))
    } else if (r.motivo === 'credenciales') {
      cuentas[clave] = { ...cuenta, conflicto: true }
    }
    escribir('cuentas', cuentas)
  }
}

let enCurso = null
let repetir = false

async function ciclosDeSincronizacion() {
  do {
    repetir = false
    await Promise.allSettled([actualizarLecciones(), subirResultados()])
  } while (repetir)
  enCurso = null
}

// Sube lo pendiente y baja las lecciones. Si no hay servidor no pasa nada: se reintenta más tarde.
// Si se pide durante otra sincronización (p. ej. acaba de volver la red), se repite al terminar,
// porque la que está en curso puede estar fallando con el estado anterior.
export function sincronizar() {
  if (enCurso) {
    repetir = true
  } else {
    enCurso = ciclosDeSincronizacion()
  }
  return enCurso
}

// ---------- Profesor (requiere conexión; el PIN no se guarda en el móvil) ----------


export async function docenteEntrar(pin) {
  try {
    const r = await llamar('docente_entrar', { p_pin: pin })
    return r.ok ? {} : { error: mensajeMotivo(r.motivo, t('errPin')) }
  } catch {
    return { error: t('errRed') }
  }
}

export async function docenteResultados(pin) {
  try {
    const r = await llamar('docente_resultados', { p_pin: pin })
    return r.ok ? { resultados: r.resultados } : { error: mensajeMotivo(r.motivo, t('errPin')) }
  } catch {
    return { error: t('errRed') }
  }
}

export async function docenteGuardarLeccion(pin, leccion, { test = false } = {}) {
  try {
    const datos = leccion.id ? leccion : { ...leccion, id: `${test ? PREFIJO_TEST : 'leccion-'}${nuevoId()}` }
    const r = await llamar('docente_guardar_leccion', { p_pin: pin, p_leccion: datos })
    if (!r.ok) {
      const invalida = r.motivo === 'leccion_invalida'
      return { error: invalida ? 'La lección tiene campos sin completar.' : mensajeMotivo(r.motivo, t('errPin')) }
    }
    await actualizarLecciones()
    return {}
  } catch {
    return { error: t('errRed') }
  }
}
