import ayuda from '../datos/contenido/ayudaIA.json'
import { t } from '../idiomas/i18n'

const VACIAS = new Set(('a al algo como con cual cuales cuando de del donde dos el ella en entre es esa ese esta este esto estos fue ha hace hacer hay la las le lo los me mi muy no o para pero por porque puede puedo que quien se ser si sin sobre son su sus te tiene tu un una uno unos y ya yo ' +
  'dime explica explicame cuentame ayuda ayudame entiendo significa quiere decir saber sabes').split(' '))

const normalizar = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// Raíz aproximada, para que "sumas" encuentre "sumar" y "gravedad" no dependa del plural.
function raiz(palabra) {
  const sinPlural = palabra.length > 3 ? palabra.replace(/(es|s)$/, '') : palabra
  return sinPlural.length > 5 ? sinPlural.slice(0, 5) : sinPlural
}

function raices(texto) {
  const palabras = normalizar(texto).match(/[\p{L}\p{N}]+/gu) ?? []
  return new Set(palabras.filter((p) => !VACIAS.has(p)).map(raiz))
}

function coincidencias(consulta, texto) {
  const destino = raices(texto)
  return [...consulta].filter((r) => destino.has(r)).length
}

const OPERACIONES = {
  '+': (a, b) => a + b, mas: (a, b) => a + b,
  '-': (a, b) => a - b, menos: (a, b) => a - b,
  x: (a, b) => a * b, '*': (a, b) => a * b, por: (a, b) => a * b,
}
const SIGNOS = { mas: '+', menos: '-', x: '×', '*': '×', por: '×' }

function cuenta(pregunta) {
  const m = normalizar(pregunta).match(/(\d+)\s*(\+|-|x|\*|mas|menos|por)\s*(\d+)/)
  if (!m) return null
  const [, a, op, b] = m
  return `${a} ${SIGNOS[op] ?? op} ${b} = ${OPERACIONES[op](+a, +b)}`
}

export const esCuenta = (pregunta) => cuenta(pregunta) !== null

function frasesDeLecciones(lecciones) {
  return lecciones.flatMap((l) => {
    const frases = l.texto.split(/(?<=[.!?])\s+/)
    return frases.map((frase, i) => ({
      // «Por eso…» no se entiende sin la frase de la que depende.
      frase: i > 0 && /^(por eso|as[ií]|entonces|tambi[eé]n)\b/i.test(frase) ? `${frases[i - 1]} ${frase}` : frase,
      leccion: l,
    }))
  })
}

// Los mejores fragmentos de las lecciones y la ayuda para una pregunta. También sirven de contexto a la IA avanzada.
export function buscarFragmentos(pregunta, lecciones, leccionActual, cantidad = 3) {
  const consulta = raices(pregunta)
  if (consulta.size === 0) return []

  const deLecciones = frasesDeLecciones(lecciones).map(({ frase, leccion }) => ({
    texto: frase,
    origen: leccion.titulo,
    puntos: coincidencias(consulta, frase) + coincidencias(consulta, leccion.titulo) * 0.5 + (leccion.id === leccionActual?.id ? 0.25 : 0),
    coincide: coincidencias(consulta, frase) + coincidencias(consulta, leccion.titulo),
  }))
  // Una entrada de ayuda es una respuesta completa sobre su tema, así que pesa más que una frase suelta.
  const deAyuda = ayuda.map((a) => {
    const coincide = coincidencias(consulta, a.claves)
    return { texto: a.respuesta, origen: null, puntos: coincide * 2, coincide }
  })

  return [...deAyuda, ...deLecciones]
    .filter((f) => f.coincide > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, cantidad)
}

export function explicarLeccion(leccion) {
  return `${t('respPorPartes', { titulo: leccion.titulo })}\n\n${leccion.texto.split(/(?<=[.!?])\s+/).map((f) => `• ${f}`).join('\n')}`
}

export function responderBasico(pregunta, lecciones, leccionActual) {
  const texto = normalizar(pregunta).trim()
  if (/^(hola|buenas|buenos dias|hey)\b/.test(texto) && texto.split(/\s+/).length <= 3) {
    return t('respHola')
  }
  if (/^(gracias|muchas gracias)\b/.test(texto)) return t('respGracias')

  const resultado = cuenta(pregunta)
  if (resultado) return resultado

  if (leccionActual && /(esta leccion|no entiendo|lo que estoy leyendo)/.test(texto)) return explicarLeccion(leccionActual)

  const [mejor, segundo] = buscarFragmentos(pregunta, lecciones, leccionActual)
  if (!mejor) {
    return t('respNoEncuentro')
  }
  let respuesta = mejor.texto
  // Dos frases de la misma lección suelen explicarse mejor juntas, pero una puede contener a la otra.
  if (segundo && mejor.origen && segundo.origen === mejor.origen && segundo.puntos >= mejor.puntos) {
    if (segundo.texto.includes(mejor.texto)) respuesta = segundo.texto
    else if (!mejor.texto.includes(segundo.texto)) respuesta = `${mejor.texto} ${segundo.texto}`
  }
  return respuesta + (mejor.origen ? `\n\n${t('respDeLeccion', { titulo: mejor.origen })}` : '')
}
