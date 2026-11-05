import es from './traducciones/es.json'

// Cada idioma se muestra en su propia lengua, para que lo reconozca quien lo habla.
export const IDIOMAS = [
  { codigo: 'es', nombre: 'Español', voz: 'es-ES' },
  { codigo: 'en', nombre: 'English', voz: 'en-GB' },
  { codigo: 'fr', nombre: 'Français', voz: 'fr-FR' },
  { codigo: 'pt', nombre: 'Português', voz: 'pt-PT' },
  { codigo: 'de', nombre: 'Deutsch', voz: 'de-DE' },
  { codigo: 'it', nombre: 'Italiano', voz: 'it-IT' },
  { codigo: 'ca', nombre: 'Català', voz: 'ca-ES' },
  { codigo: 'eu', nombre: 'Euskara', voz: 'eu-ES' },
  { codigo: 'gl', nombre: 'Galego', voz: 'gl-ES' },
  { codigo: 'ro', nombre: 'Română', voz: 'ro-RO' },
  { codigo: 'uk', nombre: 'Українська', voz: 'uk-UA' },
  { codigo: 'ru', nombre: 'Русский', voz: 'ru-RU' },
  { codigo: 'ar', nombre: 'العربية', voz: 'ar-SA', rtl: true },
  { codigo: 'zh', nombre: '中文', voz: 'zh-CN' },
]

const CLAVE = 'idioma'
const cargadores = import.meta.glob('./traducciones/*.json')

let actual = 'es'
let textos = es

export const idiomaActual = () => IDIOMAS.find((i) => i.codigo === actual)

export function idiomaGuardado() {
  const guardado = localStorage.getItem(CLAVE)
  const delNavegador = navigator.language?.slice(0, 2)
  return [guardado, delNavegador].find((c) => IDIOMAS.some((i) => i.codigo === c)) ?? 'es'
}

export async function cargarIdioma(codigo) {
  let nuevos = es
  if (codigo !== 'es') {
    try {
      nuevos = (await cargadores[`./traducciones/${codigo}.json`]()).default
    } catch {
      return actual // Sin ese archivo, mejor seguir en el idioma actual que dejar la app a medias.
    }
  }
  actual = codigo
  textos = nuevos
  document.documentElement.lang = codigo
  document.documentElement.dir = idiomaActual().rtl ? 'rtl' : 'ltr'
  return codigo
}

export async function cambiarIdioma(codigo) {
  const cargado = await cargarIdioma(codigo)
  if (cargado === codigo) localStorage.setItem(CLAVE, codigo)
  return cargado
}

export function t(clave, datos = {}) {
  const texto = textos[clave] ?? es[clave] ?? clave
  return texto.replace(/\{(\w+)\}/g, (_, nombre) => datos[nombre] ?? '')
}
