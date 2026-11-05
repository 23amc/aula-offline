import { useSyncExternalStore } from 'react'
import { idiomaActual, t } from '../idiomas/i18n'

// Un único modelo para toda la app: chat, esquemas y corrección de problemas.
const CLAVE_ACTIVADA = 'ia_avanzada'

export const hayGPU = Boolean(navigator.gpu)

let estado = { fase: 'basica', progreso: 0, aviso: '', ocupada: false } // fase: basica | descargando | lista
let motor = null
let carga = null
let cola = Promise.resolve()
const oyentes = new Set()

function cambiar(cambios) {
  estado = { ...estado, ...cambios }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar) {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

export const useIA = () => useSyncExternalStore(suscribir, () => estado)
export const estadoIA = () => estado

export function iaActivada() {
  try {
    return Boolean(localStorage.getItem(CLAVE_ACTIVADA))
  } catch {
    return false
  }
}

// Devuelve null si no se pudo: quien la pide sigue con el modo básico.
export function activarIA() {
  if (motor) return Promise.resolve(motor)
  if (carga) return carga
  cambiar({ fase: 'descargando', progreso: 0, aviso: '' })
  carga = (async () => {
    try {
      const { cargarMotor } = await import('./motorIA')
      motor = await cargarMotor((progreso) => cambiar({ progreso }))
      localStorage.setItem(CLAVE_ACTIVADA, '1')
      cambiar({ fase: 'lista' })
      return motor
    } catch {
      cambiar({ fase: 'basica', aviso: navigator.onLine ? t('errIA') : t('errIASinRed') })
      // Sin conexión puede ser algo pasajero: se reintentará la próxima vez.
      if (navigator.onLine) localStorage.removeItem(CLAVE_ACTIVADA)
      return null
    } finally {
      carga = null
    }
  })()
  return carga
}

export async function desactivarIA() {
  localStorage.removeItem(CLAVE_ACTIVADA)
  cambiar({ fase: 'basica' })
  await motor?.unload().catch(() => {})
  motor = null
  const { borrarModelo } = await import('./motorIA')
  await borrarModelo().catch(() => {})
  cambiar({ aviso: t('iaDesactivada') })
}

// El motor atiende una petición cada vez: las demás esperan su turno.
export function generar(mensajes, { onTexto, maxTokens = 200, temperatura = 0.3 } = {}) {
  const peticion = cola.then(async () => {
    if (!motor) throw new Error('La IA avanzada no está lista')
    cambiar({ ocupada: true })
    try {
      const flujo = await motor.chat.completions.create({ messages: mensajes, temperature: temperatura, max_tokens: maxTokens, stream: true })
      let texto = ''
      for await (const trozo of flujo) {
        texto += trozo.choices[0]?.delta?.content ?? ''
        if (texto) onTexto?.(texto)
      }
      return texto.trim()
    } finally {
      cambiar({ ocupada: false })
    }
  })
  cola = peticion.catch(() => {})
  return peticion
}

export const interrumpir = () => motor?.interruptGenerate()

export const PERSONALIDAD = `Eres la mascota de EduGo, un libro simpático que hace de tutor en una app educativa para niños y niñas.
Responde con frases cortas y sencillas. Habla solo de temas adecuados para menores.`

export const enIdioma = () => `Responde siempre en este idioma: ${idiomaActual().nombre}.`
