import leccionesBase from './data/lecciones.json'
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
  if (motivo === 'bloqueado') return 'Demasiados intentos fallidos. Prueba dentro de 15 minutos.'
  return credenciales
}

// ---------- Cuentas de alumno guardadas en este móvil ----------

const leerCuentas = () => leer('cuentas', {})

function validarAlias(alias) {
  const limpio = alias.trim()
  if (limpio.length < 1 || limpio.length > 30) return 'El alias debe tener entre 1 y 30 caracteres.'
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
  if (!/^\d{4,8}$/.test(pin)) return { error: 'El PIN debe tener entre 4 y 8 números.' }
  const limpio = alias.trim()
  if (leerCuentas()[normalizar(limpio)]) return { error: 'Ese alias ya está registrado en este móvil. Inicia sesión con tu PIN.' }

  try {
    const r = await llamar('alumno_sincronizar', { p_alias: limpio, p_pin: pin, p_resultados: [], p_crear: true })
    if (!r.ok) return { error: mensajeMotivo(r.motivo, 'Ese alias ya está en uso. Elige otro.') }
    return { cuenta: abrirSesion({ alias: r.alias, pin, sincronizada: true }) }
  } catch {
    // Sin servidor: la cuenta se crea en el móvil y se registra al sincronizar.
    return { cuenta: abrirSesion({ alias: limpio, pin, sincronizada: false }) }
  }
}

export async function entrarAlumno(alias, pin) {
  const local = leerCuentas()[normalizar(alias)]
  if (local) {
    return local.pin === pin ? { cuenta: abrirSesion(local) } : { error: 'Alias o PIN incorrectos.' }
  }
  try {
    const r = await llamar('alumno_sincronizar', { p_alias: alias.trim(), p_pin: pin, p_resultados: [], p_crear: false })
    if (!r.ok) return { error: mensajeMotivo(r.motivo, 'Alias o PIN incorrectos.') }
    return { cuenta: abrirSesion({ alias: r.alias, pin, sincronizada: true }) }
  } catch {
    return { error: 'Para iniciar sesión por primera vez en este móvil necesitas conexión.' }
  }
}

// Para cuentas creadas sin conexión cuyo alias resultó estar ocupado en el servidor.
export function cambiarAlias(cuenta, nuevoAlias) {
  const errorAlias = validarAlias(nuevoAlias)
  if (errorAlias) return { error: errorAlias }
  const limpio = nuevoAlias.trim()
  const cuentas = leerCuentas()
  if (cuentas[normalizar(limpio)]) return { error: 'Ese alias ya está registrado en este móvil.' }

  const claveVieja = normalizar(cuenta.alias)
  escribir('resultados', leer('resultados', []).map((r) =>
    normalizar(r.alias) === claveVieja ? { ...r, alias: limpio } : r
  ))
  delete cuentas[claveVieja]
  escribir('cuentas', cuentas)
  return { cuenta: abrirSesion({ alias: limpio, pin: cuenta.pin, sincronizada: false }) }
}

// ---------- Resultados ----------

export function guardarResultado(resultado) {
  escribir('resultados', [...leer('resultados', []), { ...resultado, id: nuevoId(), enviado: false }])
}

export function contarPendientes(alias) {
  return leer('resultados', []).filter((r) => !r.enviado && normalizar(r.alias) === normalizar(alias)).length
}

// ---------- Lecciones: las incluidas en la app más las del servidor, que tienen prioridad ----------

export function leerLecciones() {
  const delServidor = leer('lecciones_servidor', [])
  const porId = new Map(delServidor.map((l) => [l.id, l]))
  const base = leccionesBase.map((l) => porId.get(l.id) ?? l)
  const idsBase = new Set(leccionesBase.map((l) => l.id))
  return [...base, ...delServidor.filter((l) => !idsBase.has(l.id))]
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

const ERROR_RED = 'No se pudo conectar con el servidor.'
const ERROR_PIN = 'PIN incorrecto.'

export async function docenteEntrar(pin) {
  try {
    const r = await llamar('docente_entrar', { p_pin: pin })
    return r.ok ? {} : { error: mensajeMotivo(r.motivo, ERROR_PIN) }
  } catch {
    return { error: ERROR_RED }
  }
}

export async function docenteResultados(pin) {
  try {
    const r = await llamar('docente_resultados', { p_pin: pin })
    return r.ok ? { resultados: r.resultados } : { error: mensajeMotivo(r.motivo, ERROR_PIN) }
  } catch {
    return { error: ERROR_RED }
  }
}

export async function docenteGuardarLeccion(pin, leccion) {
  try {
    const datos = leccion.id ? leccion : { ...leccion, id: `leccion-${nuevoId()}` }
    const r = await llamar('docente_guardar_leccion', { p_pin: pin, p_leccion: datos })
    if (!r.ok) {
      const invalida = r.motivo === 'leccion_invalida'
      return { error: invalida ? 'La lección tiene campos sin completar.' : mensajeMotivo(r.motivo, ERROR_PIN) }
    }
    await actualizarLecciones()
    return {}
  } catch {
    return { error: ERROR_RED }
  }
}
