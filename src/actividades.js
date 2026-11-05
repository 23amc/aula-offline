export const TIPOS = [
  { id: 'opciones', nombre: 'Elegir una opción' },
  { id: 'emparejar', nombre: 'Emparejar' },
  { id: 'ordenar', nombre: 'Ordenar' },
  { id: 'huecos', nombre: 'Rellenar huecos' },
]

// Las tareas sin campo "tipo" son las preguntas de opciones de siempre.
export const tipoDe = (tarea) => tarea.tipo ?? 'opciones'

export function tareaVacia(tipo, pregunta = '') {
  if (tipo === 'emparejar') {
    return { tipo, pregunta, pares: [{ izquierda: '', derecha: '' }, { izquierda: '', derecha: '' }] }
  }
  if (tipo === 'ordenar') return { tipo, pregunta, pasos: ['', '', ''] }
  if (tipo === 'huecos') return { tipo, pregunta, frase: '', respuestas: [] }
  return { pregunta, opciones: ['', '', ''], correcta: 0 }
}

const HUECO = /_{3,}/

export const partesDeFrase = (frase) => frase.split(HUECO)
export const contarHuecos = (frase) => partesDeFrase(frase).length - 1

// Para que "Gravedad " o "sólido" sin tilde también cuenten como correctas.
export const normalizarRespuesta = (texto) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()

export function barajar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export function validarTarea(tarea, numero) {
  const vacio = (texto) => !texto?.trim()
  if (vacio(tarea.pregunta)) return `Escribe el enunciado de la tarea ${numero}.`

  switch (tipoDe(tarea)) {
    case 'emparejar':
      if (tarea.pares.length < 2 || tarea.pares.some((p) => vacio(p.izquierda) || vacio(p.derecha))) {
        return `La tarea ${numero} necesita al menos 2 parejas completas.`
      }
      return null
    case 'ordenar':
      if (tarea.pasos.length < 2 || tarea.pasos.some(vacio)) {
        return `La tarea ${numero} necesita al menos 2 pasos, todos con texto.`
      }
      return null
    case 'huecos': {
      const huecos = contarHuecos(tarea.frase)
      if (huecos === 0) return `La frase de la tarea ${numero} necesita al menos un hueco (___).`
      if (tarea.respuestas.slice(0, huecos).filter((r) => !vacio(r)).length < huecos) {
        return `Escribe la respuesta de cada hueco de la tarea ${numero}.`
      }
      return null
    }
    default:
      if (tarea.opciones.length < 2 || tarea.opciones.some(vacio)) {
        return `La tarea ${numero} necesita al menos 2 opciones, todas con texto.`
      }
      return null
  }
}

// Si se borró un hueco de la frase, su respuesta ya no debe guardarse.
export function limpiarTarea(tarea) {
  if (tipoDe(tarea) !== 'huecos') return tarea
  return { ...tarea, respuestas: tarea.respuestas.slice(0, contarHuecos(tarea.frase)) }
}
