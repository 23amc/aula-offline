export const TIPOS = [
  { id: 'opciones', nombre: 'Elegir una opción' },
  { id: 'emparejar', nombre: 'Emparejar' },
  { id: 'unir', nombre: 'Unir con flechas' },
  { id: 'ordenar', nombre: 'Ordenar' },
  { id: 'huecos', nombre: 'Rellenar huecos' },
  { id: 'problema', nombre: 'Problema con respuesta escrita' },
]

export const ILUSTRACIONES = [
  { id: 'fabula', nombre: 'Libro de cuentos con una tortuga' },
  { id: 'tortuga-rio', nombre: 'Tortuga ante un río, con su familia en la otra orilla' },
  { id: 'animales-dudan', nombre: 'Un conejo le dice que no a una tortuga' },
  { id: 'tortuga-pasos', nombre: 'Tortuga avanzando día tras día' },
  { id: 'meta-alcanzada', nombre: 'Tortuga llegando a la meta' },
  { id: 'tres-estados', nombre: 'Hielo, agua líquida y vapor' },
  { id: 'hielo', nombre: 'Cubitos de hielo' },
  { id: 'vapor', nombre: 'Tetera echando vapor' },
  { id: 'olla-hirviendo', nombre: 'Olla de agua hirviendo al fuego' },
  { id: 'congelar', nombre: 'Termómetro frío, copo de nieve y hielo' },
  { id: 'tierra-gravedad', nombre: 'Flechas que apuntan hacia el centro de la Tierra' },
  { id: 'pelota-cae', nombre: 'Una mano suelta una pelota, que cae al suelo' },
  { id: 'luna-orbita', nombre: 'La Luna girando alrededor de la Tierra' },
  { id: 'astronauta-salto', nombre: 'Astronauta dando un salto largo en la Luna' },
  { id: 'piedra-lanzada', nombre: 'Una piedra sube y vuelve a caer' },
]

// Las tareas sin campo "tipo" son las preguntas de opciones de siempre.
export const tipoDe = (tarea) => tarea.tipo ?? 'opciones'

export function tareaVacia(tipo, pregunta = '') {
  if (tipo === 'emparejar' || tipo === 'unir') {
    return { tipo, pregunta, pares: [{ izquierda: '', derecha: '' }, { izquierda: '', derecha: '' }] }
  }
  if (tipo === 'ordenar') return { tipo, pregunta, pasos: ['', '', ''] }
  if (tipo === 'huecos') return { tipo, pregunta, frase: '', respuestas: [] }
  if (tipo === 'problema') return { tipo, pregunta, respuesta: '', aceptadas: [], unidad: '', pista: '', pasos: [''] }
  return { pregunta, opciones: ['', '', ''], correcta: 0 }
}

// Dos huecos pueden compartir enunciado ("Completa la frase") y distinguirse por su frase.
export const identidadTarea = (tarea) => (tarea.frase ? `${tarea.pregunta}|${tarea.frase}` : tarea.pregunta)
export const claveTarea = (idLeccion, tarea) => `${idLeccion}|${identidadTarea(tarea)}`

// El enunciado y sus opciones como texto corrido, para leerlos en voz alta. Las lecciones están en español.
export function textoTarea(tarea) {
  switch (tipoDe(tarea)) {
    case 'huecos':
      return `${tarea.pregunta} ${tarea.frase.replace(/_{3,}/g, ', hueco, ')}`
    case 'ordenar':
      return `${tarea.pregunta} ${tarea.pasos.join('. ')}`
    case 'problema':
      return tarea.pregunta
    case 'emparejar':
    case 'unir':
      return `${tarea.pregunta} ${tarea.pares.map((p) => p.izquierda).join(', ')}. ${tarea.pares.map((p) => p.derecha).join(', ')}.`
    default:
      return `${tarea.pregunta} ${tarea.opciones.join('. ')}`
  }
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

// Baraja reintentando para no mostrar la actividad ya resuelta.
export function barajarSinResolver(lista, estaResuelta) {
  let barajada = barajar(lista)
  for (let intento = 0; intento < 10 && estaResuelta(barajada); intento++) barajada = barajar(lista)
  return barajada
}

export function validarTarea(tarea, numero) {
  const vacio = (texto) => !texto?.trim()
  if (vacio(tarea.pregunta)) return `Escribe el enunciado de la tarea ${numero}.`

  switch (tipoDe(tarea)) {
    case 'emparejar':
    case 'unir':
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
    case 'problema':
      if (vacio(tarea.respuesta)) return `Escribe la respuesta correcta de la tarea ${numero}.`
      return null
    default:
      if (tarea.opciones.length < 2 || tarea.opciones.some(vacio)) {
        return `La tarea ${numero} necesita al menos 2 opciones, todas con texto.`
      }
      return null
  }
}

// Si se borró un hueco de la frase, su respuesta ya no debe guardarse.
export function limpiarTarea(tarea) {
  if (tipoDe(tarea) === 'problema') {
    const { unidad, pista, ...resto } = tarea
    return {
      ...resto,
      respuesta: tarea.respuesta.trim(),
      aceptadas: (tarea.aceptadas ?? []).map((a) => a.trim()).filter(Boolean),
      pasos: (tarea.pasos ?? []).map((p) => p.trim()).filter(Boolean),
      ...(unidad?.trim() ? { unidad: unidad.trim() } : {}),
      ...(pista?.trim() ? { pista: pista.trim() } : {}),
    }
  }
  if (tipoDe(tarea) !== 'huecos') return tarea
  return { ...tarea, respuestas: tarea.respuestas.slice(0, contarHuecos(tarea.frase)) }
}
