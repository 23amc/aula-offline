import { normalizarRespuesta } from './actividades'
import { enIdioma, generar, PERSONALIDAD } from '../ia/motorCompartido'
import { t } from '../idiomas/i18n'

// ---------- Números escritos con cifras, fracciones, decimales o palabras ----------

const UNIDADES = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18,
  diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900, medio: 0.5, media: 0.5,
}

const PARTES = { medio: 2, tercio: 3, cuarto: 4, quinto: 5, sexto: 6, septimo: 7, octavo: 8, noveno: 9, decimo: 10 }

function numeroEnPalabras(texto) {
  let total = 0
  let encontrado = false
  for (const palabra of texto.split(/\s+/)) {
    if (palabra === 'y') continue
    if (palabra === 'mil') {
      total = (total || 1) * 1000
      encontrado = true
    } else if (palabra in UNIDADES) {
      total += UNIDADES[palabra]
      encontrado = true
    } else if (encontrado) {
      break
    }
  }
  return encontrado ? total : null
}

function valorDe(trozo) {
  const [a, b] = trozo.split('/').map((x) => Number(x.trim()))
  if (b === undefined) return a
  return b === 0 ? null : a / b
}

// El último número del texto: en «12 : 3 = 4» la respuesta es el 4.
export function leerNumero(texto) {
  let limpio = normalizarRespuesta(String(texto))
    .replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/−/g, '-')
  const cifras = limpio.match(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g)
  if (cifras) {
    const ultimo = cifras.at(-1)
    return { valor: valorDe(ultimo), decimal: ultimo.includes('.') }
  }
  limpio = limpio.replace(/[^\p{L}\s]/gu, ' ')
  const fraccion = limpio.match(/\b([a-z]+)\s+(medio|tercio|cuarto|quinto|sexto|septimo|octavo|noveno|decimo)s?\b/)
  if (fraccion && UNIDADES[fraccion[1]] >= 1) {
    return { valor: UNIDADES[fraccion[1]] / PARTES[fraccion[2]], decimal: false }
  }
  const valor = numeroEnPalabras(limpio)
  return valor === null ? null : { valor, decimal: false }
}

export const esNumerica = (tarea) => /^\s*-?[\d.,]+(\s*\/\s*\d+)?\s*$/.test(String(tarea.respuesta))

// ---------- Texto: sin tildes, sin artículos y aceptando una letra mal puesta ----------

const VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'es', 'son', 'y', 'en', 'a', 'que', 'se'])
const palabras = (texto) => normalizarRespuesta(texto).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((p) => p && !VACIAS.has(p))

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0]
    fila[0] = i
    for (let j = 1; j <= b.length; j++) {
      const actual = fila[j]
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1))
      anterior = actual
    }
  }
  return fila[b.length]
}

function compararTexto(escrito, candidata) {
  const delAlumno = palabras(escrito)
  const esperadas = palabras(candidata)
  if (esperadas.length === 0) return null
  if (esperadas.every((p) => delAlumno.includes(p))) return 'exacta'
  const parecida = (p) => delAlumno.some((q) => p.length >= 5 && distancia(p, q) <= 1)
  if (esperadas.every((p) => delAlumno.includes(p) || parecida(p))) return 'ortografia'
  return null
}

// ---------- Corrección ----------

export function corregirProblema(tarea, escrito) {
  if (esNumerica(tarea)) {
    // Otras formas válidas del mismo dato, como 19 para «las 7 de la tarde».
    const esperados = [tarea.respuesta, ...(tarea.aceptadas ?? [])].map((r) => leerNumero(r)?.valor).filter((v) => v !== null && v !== undefined)
    const leido = leerNumero(escrito)
    if (!leido || leido.valor === null) return { correcta: false, sinNumero: true }
    const margen = leido.decimal ? 0.0051 : 1e-9
    return { correcta: esperados.some((v) => Math.abs(leido.valor - v) < margen), valor: leido.valor }
  }
  for (const candidata of [tarea.respuesta, ...(tarea.aceptadas ?? [])]) {
    const resultado = compararTexto(escrito, candidata)
    if (resultado) return { correcta: true, ortografia: resultado === 'ortografia' ? candidata : null }
  }
  return { correcta: false }
}

const OPERACIONES = [
  ['sumar', (a, b) => a + b],
  ['restar', (a, b) => a - b],
  ['restar', (a, b) => b - a],
  ['multiplicar', (a, b) => a * b],
  ['dividir', (a, b) => a / b],
  ['dividir', (a, b) => b / a],
]

// Busca el error típico: haber hecho otra operación con los datos del problema, o una cuenta casi bien.
export function diagnosticar(tarea, correccion) {
  if (correccion.correcta || !esNumerica(tarea)) return null
  if (correccion.sinNumero) return t('diagSinNumero')
  const valor = correccion.valor
  const esperado = leerNumero(tarea.respuesta).valor
  const datos = (tarea.pregunta.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.'))).slice(0, 4)
  const igual = (x, y) => Math.abs(x - y) < 1e-9

  if (datos.some((d) => igual(d, valor)) && !igual(valor, esperado)) return t('diagDato')

  for (let i = 0; i < datos.length; i++) {
    for (let j = i + 1; j < datos.length; j++) {
      const hecha = OPERACIONES.find(([, op]) => igual(op(datos[i], datos[j]), valor))
      const buena = OPERACIONES.find(([, op]) => igual(op(datos[i], datos[j]), esperado))
      if (hecha && buena && hecha[0] !== buena[0]) {
        return t('diagOperacion', { hecha: t(`op.${hecha[0]}.hecho`), buena: t(`op.${buena[0]}`) })
      }
    }
  }
  if (Number.isInteger(esperado) && Math.abs(valor - esperado) <= 2) return t('diagCerca')
  if (Number.isInteger(esperado) && esperado !== 0 && igual(valor, esperado * 10)) return t('diagCero')
  if (Number.isInteger(esperado) && esperado >= 10 && igual(valor, esperado / 10)) return t('diagCero')
  return null
}

// ---------- Con la IA avanzada ----------

const solucion = (tarea) => [...(tarea.pasos ?? []), `Respuesta correcta: ${tarea.respuesta}${tarea.unidad ? ` ${tarea.unidad}` : ''}`].join('\n')

// La IA no decide la nota de los números: solo explica, con la solución delante para no inventarse otra.
export function explicarConIA(tarea, escrito, onTexto) {
  return generar([
    { role: 'system', content: `${PERSONALIDAD}\nEres un tutor paciente. ${enIdioma()}` },
    {
      role: 'user',
      content: `Problema: ${tarea.pregunta}
Respuesta del alumno: ${escrito}
Solución correcta, que no debes cambiar:
${solucion(tarea)}
Explica al alumno en 3 o 4 frases cortas en qué se ha equivocado y cómo se resuelve. Empieza animándole.`,
    },
  ], { onTexto, maxTokens: 220, temperatura: 0.2 })
}

// Para respuestas de texto que no coinciden: la IA decide si dicen lo mismo con otras palabras.
export async function valorarConIA(tarea, escrito) {
  const veredicto = await generar([
    { role: 'system', content: 'Eres un profesor que corrige respuestas cortas de primaria. Responde solo SI o NO.' },
    {
      role: 'user',
      content: `Pregunta: ${tarea.pregunta}
Respuesta correcta: ${[tarea.respuesta, ...(tarea.aceptadas ?? [])].join(' / ')}
Respuesta del alumno: ${escrito}
¿La respuesta del alumno significa lo mismo que la correcta? Responde solo SI o NO.`,
    },
  ], { maxTokens: 4, temperatura: 0 })
  return /^\s*s[ií]/i.test(veredicto)
}
