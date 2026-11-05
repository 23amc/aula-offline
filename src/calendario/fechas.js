import { idiomaActual, t } from '../idiomas/i18n'

// Las fechas se guardan como "2026-11-05", en hora local: un examen es de un día, no de un instante.
const dosCifras = (n) => String(n).padStart(2, '0')
export const aISO = (d) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`
export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}
export const hoyISO = () => aISO(new Date())
export function sumarDias(iso, dias) {
  const d = deISO(iso)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}
export const diasHasta = (iso) => Math.round((deISO(iso) - deISO(hoyISO())) / 86400000)

export function cuandoEs(iso) {
  const n = diasHasta(iso)
  if (n === 0) return t('hoy')
  if (n === 1) return t('manana')
  if (n < 0) return t('haceDias', { n: -n })
  return t('enDias', { n })
}

export const conMayuscula = (texto) => texto.charAt(0).toLocaleUpperCase() + texto.slice(1)
export const formatoDia = (iso, opciones) => conMayuscula(deISO(iso).toLocaleDateString(idiomaActual().codigo, opciones))

export const TIPOS_EVENTO = [
  { id: 'examen', clave: 'tipoExamen', tono: 'coral' },
  { id: 'deberes', clave: 'tipoDeberes', tono: 'azul' },
  { id: 'repaso', clave: 'tipoRepaso', tono: 'verde' },
  { id: 'excursion', clave: 'tipoExcursion', tono: 'amarillo' },
  { id: 'otro', clave: 'tipoOtro', tono: 'azul' },
]
export const tipoEvento = (id) => TIPOS_EVENTO.find((tipo) => tipo.id === id) ?? TIPOS_EVENTO.at(-1)
