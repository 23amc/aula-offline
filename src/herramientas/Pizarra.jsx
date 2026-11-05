import { useRef, useState } from 'react'
import { t } from '../idiomas/i18n'
import PanelLateral from './PanelLateral'

// Resolución fija: el dibujo no se pierde al plegar la pizarra ni al girar el móvil.
const ANCHO = 1200
const ALTO = 1600
const GROSOR = 14
const GROSOR_GOMA = 70
const BLANCO = '#ffffff'
const PASO_TECLADO = 40
const FLECHAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }

const COLORES = [
  { clave: 'colorNegro', valor: '#111827' },
  { clave: 'colorAzul', valor: '#2563eb' },
  { clave: 'colorRojo', valor: '#dc2626' },
  { clave: 'colorVerde', valor: '#16a34a' },
  { clave: 'colorAmarillo', valor: '#facc15' },
  { clave: 'colorMorado', valor: '#9333ea' },
]

export default function Pizarra({ abierta, oculta, onAlternar }) {
  const [color, setColor] = useState(COLORES[0].valor)
  const lienzo = useRef(null)
  const punteroActivo = useRef(null)
  const pluma = useRef({ x: ANCHO / 2, y: ALTO / 2 })
  const [anuncio, setAnuncio] = useState('')

  function posicion(e) {
    const caja = lienzo.current.getBoundingClientRect()
    return { x: ((e.clientX - caja.left) / caja.width) * ANCHO, y: ((e.clientY - caja.top) / caja.height) * ALTO }
  }

  function empezar(e) {
    // Un segundo dedo o el botón derecho no deben interferir con el trazo.
    if (punteroActivo.current !== null || e.button !== 0) return
    punteroActivo.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const ctx = lienzo.current.getContext('2d')
    const { x, y } = posicion(e)
    const grosor = color === BLANCO ? GROSOR_GOMA : GROSOR
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = grosor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // Un toque sin mover también deja un punto; un trazo de longitud cero no se dibujaría.
    ctx.beginPath()
    ctx.arc(x, y, grosor / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function mover(e) {
    if (e.pointerId !== punteroActivo.current) return
    const ctx = lienzo.current.getContext('2d')
    const { x, y } = posicion(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function terminar(e) {
    if (e.pointerId === punteroActivo.current) punteroActivo.current = null
  }

  // Dibujar con el teclado, para quien no puede usar ratón ni pantalla táctil.
  function teclaDibujo(e) {
    const direccion = FLECHAS[e.key]
    if (!direccion) return
    e.preventDefault()
    const ctx = lienzo.current.getContext('2d')
    const { x, y } = pluma.current
    const destino = {
      x: Math.min(ANCHO, Math.max(0, x + direccion[0] * PASO_TECLADO)),
      y: Math.min(ALTO, Math.max(0, y + direccion[1] * PASO_TECLADO)),
    }
    ctx.strokeStyle = color
    ctx.lineWidth = color === BLANCO ? GROSOR_GOMA : GROSOR
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(destino.x, destino.y)
    ctx.stroke()
    pluma.current = destino
  }

  function borrarTodo() {
    lienzo.current.getContext('2d').clearRect(0, 0, ANCHO, ALTO)
    setAnuncio(t('pizarraBorrada'))
  }

  return (
    <PanelLateral nombre={t('pizarra')} posicion="arriba" abierto={abierta} oculto={oculta} onAlternar={onAlternar}>
        <p className="sr-only" role="status">{anuncio}</p>
        <div className="pizarra-colores">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              className="pizarra-color"
              style={{ background: c.valor }}
              aria-label={t(c.clave)}
              aria-pressed={color === c.valor}
              onClick={() => setColor(c.valor)}
            />
          ))}
          <button className="pizarra-goma secundario" aria-pressed={color === BLANCO} onClick={() => setColor(BLANCO)}>{t('goma')}</button>
          <button className="pizarra-borrar" onClick={borrarTodo}>{t('borrarTodo')}</button>
        </div>
        <p className="ayuda">{t('ayudaLienzo')}</p>
        <canvas
          ref={lienzo}
          className="pizarra-lienzo"
          width={ANCHO}
          height={ALTO}
          aria-label={t('lienzo')}
          tabIndex={0}
          onKeyDown={teclaDibujo}
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
        />
    </PanelLateral>
  )
}
