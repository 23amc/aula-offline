import { enIdioma, generar, PERSONALIDAD } from '../ia/motorCompartido'

const COLORES = [
  ['#0771b8', '#e0f2fe'],
  ['#a87c00', '#fff2c2'],
  ['#0b8a60', '#d9f5e9'],
  ['#dd4a3a', '#ffe2dc'],
  ['#6d28d9', '#ede9fe'],
  ['#0e7490', '#cffafe'],
]
// [trazo, fondo] de cada rama, igual en el mapa y en la lista.
export const colorRama = (i) => COLORES[i % COLORES.length]

const MAX_RAMAS = 6
const MAX_IDEAS = 4

const mayuscula = (s) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s)
const recortar = (s, max) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)
const frases = (texto) => texto.split(/(?<=[.!?])\s+/).map((f) => f.trim()).filter(Boolean)

function limpiar(linea) {
  return linea
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(#+|[-*•+·–—]|\d+[.)])\s*/, '')
    .replace(/[.;,\s]+$/, '')
    .trim()
}

// Las primeras palabras de una frase, sin el artículo, como nombre de rama.
function resumir(frase) {
  const palabras = frase.replace(/^(el|la|los|las|un|una)\s+/i, '').split(/\s+/)
  return mayuscula(palabras.slice(0, 3).join(' ') + (palabras.length > 3 ? '…' : ''))
}

function ordenar(ramas, tema = '') {
  const temaNormal = tema.trim().toLowerCase()
  return ramas
    .map((r) => ({
      titulo: recortar(mayuscula(r.titulo.trim()), 40),
      ideas: r.ideas.map((i) => recortar(mayuscula(i.trim()), 90)).filter(Boolean).slice(0, MAX_IDEAS),
    }))
    .filter((r) => r.titulo && !/esquema/i.test(r.titulo) && r.titulo.toLowerCase() !== temaNormal)
    .slice(0, MAX_RAMAS)
}

// Sin IA: cada definición («X es…») abre una rama y los ejemplos que la siguen se cuelgan de ella.
export function esquemaBasico({ titulo, texto = '', ejemplos = [] }) {
  const ramas = []
  for (const frase of frases(texto)) {
    const limpia = frase.replace(/[.!?]+$/, '')
    const etiqueta = limpia.match(/^([^:]{2,45}):\s*(.+)$/)
    const definicion = limpia.match(/^(?:(?:el|la|los|las|un|una)\s+)?([^,]{2,40}?)\s+(?:es|son|significa|se llaman?|consiste en)\s+(.+)$/i)
    const continua = /^(si|por ejemplo|por eso|cuando|as[ií]|entonces|tambi[eé]n|ahora|cada|al)\b/i.test(limpia)
    const ultima = ramas.at(-1)
    if (etiqueta && !continua) ramas.push({ titulo: etiqueta[1].length > 25 ? resumir(etiqueta[1]) : etiqueta[1], ideas: [etiqueta[2]] })
    else if (definicion && !continua) ramas.push({ titulo: definicion[1], ideas: [definicion[2]] })
    else if (ultima && ultima.ideas.length < MAX_IDEAS) ultima.ideas.push(limpia)
    else ramas.push({ titulo: resumir(limpia), ideas: [limpia] })
  }
  if (ejemplos.length > 0) ramas.push({ titulo: 'Ejemplos', ideas: ejemplos.map((e) => `${e.titulo}: ${e.resultado}`) })
  return { titulo, ramas: ordenar(ramas, titulo) }
}

export function esquemaDeLeccion(leccion) {
  if (leccion.esquema?.length) return { titulo: leccion.titulo, ramas: ordenar(leccion.esquema) }
  return esquemaBasico(leccion)
}

// Entiende las listas que suele escribir el modelo: con sangría, con títulos sin viñeta o «Idea: detalle».
export function leerEsquemaTexto(texto, tema = '') {
  const lineas = texto
    .split('\n')
    .map((l) => l.replace(/\t/g, '  '))
    .filter((l) => l.trim() && !/^\s*#/.test(l))
    .map((l) => ({ sangria: l.match(/^\s*/)[0].length, vineta: /^\s*([-*•+·–]|\d+[.)])\s+/.test(l), texto: limpiar(l) }))
    .filter((l) => l.texto)

  const conVineta = lineas.filter((l) => l.vineta)
  const sinVineta = lineas.filter((l) => !l.vineta)
  const ramas = []

  if (sinVineta.length >= 2 && conVineta.length > 0) {
    for (const l of lineas) {
      if (!l.vineta) ramas.push({ titulo: l.texto.replace(/:$/, ''), ideas: [] })
      else ramas.at(-1)?.ideas.push(l.texto)
    }
  } else if (conVineta.length > 0) {
    const minima = Math.min(...conVineta.map((l) => l.sangria))
    const anidado = conVineta.some((l) => l.sangria > minima)
    for (const l of conVineta) {
      if (!anidado || l.sangria === minima) {
        const [titulo, ...resto] = l.texto.split(/:\s*/)
        ramas.push({ titulo, ideas: resto.length ? [resto.join(': ')] : [] })
      } else {
        ramas.at(-1)?.ideas.push(l.texto)
      }
    }
  }
  return ordenar(ramas, tema)
}

export async function esquemaConIA(tema, informacion = '') {
  const texto = await generar([
    { role: 'system', content: `${PERSONALIDAD}\n${enIdioma()}` },
    {
      role: 'user',
      content: `Haz un esquema sobre «${tema}» para un alumno de primaria.${informacion ? `\nUsa esta información:\n${informacion}` : ''}
Escribe de 3 a 5 ideas principales y, debajo de cada una, de 1 a 3 detalles muy cortos.
Usa exactamente este formato y no escribas nada más:
- Idea principal
  - detalle
  - detalle`,
    },
  ], { maxTokens: 320, temperatura: 0.2 })
  const ramas = leerEsquemaTexto(texto, tema)
  return ramas.length >= 2 ? { titulo: tema, ramas } : null
}

export const textoEsquema = ({ titulo, ramas }) =>
  `${titulo}. ${ramas.map((r) => `${r.titulo}: ${r.ideas.join('. ')}`).join('. ')}`
