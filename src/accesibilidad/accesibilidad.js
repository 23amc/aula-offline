const CLAVE = 'accesibilidad'

export const TAMANOS = [
  { valor: 100, clave: 'tamanoNormal' },
  { valor: 125, clave: 'tamanoGrande' },
  { valor: 150, clave: 'tamanoMuyGrande' },
]

const INICIALES = { tamano: 100, altoContraste: false, letraLegible: false, sinAnimaciones: false, leerSolo: false }

export function leerAjustes() {
  return { ...INICIALES, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }
}

export function aplicarAjustes(ajustes) {
  const raiz = document.documentElement
  raiz.style.fontSize = `${ajustes.tamano}%`
  raiz.classList.toggle('alto-contraste', ajustes.altoContraste)
  raiz.classList.toggle('letra-legible', ajustes.letraLegible)
  raiz.classList.toggle('sin-animaciones', ajustes.sinAnimaciones)
}

export function guardarAjustes(ajustes) {
  localStorage.setItem(CLAVE, JSON.stringify(ajustes))
  aplicarAjustes(ajustes)
}

// ---------- Voz: la del propio dispositivo, que normalmente funciona sin conexión ----------

export const hayVoz = () => 'speechSynthesis' in window

export function hablar(texto, alTerminar, lengua = 'es-ES') {
  if (!hayVoz()) return
  window.speechSynthesis.cancel()
  const frase = new SpeechSynthesisUtterance(texto)
  frase.lang = lengua
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lengua.slice(0, 2)))
  if (voz) frase.voice = voz
  if (alTerminar) {
    frase.onend = alTerminar
    frase.onerror = alTerminar
  }
  window.speechSynthesis.speak(frase)
}

export function callar() {
  if (hayVoz()) window.speechSynthesis.cancel()
}

// Al cambiar de pantalla, el foco va al título: así un lector de pantalla la anuncia y el teclado sigue desde ahí.
export function enfocarTitulo() {
  const titulo = document.querySelector('main h1')
  if (!titulo) return
  titulo.setAttribute('tabindex', '-1')
  titulo.focus({ preventScroll: false })
}
