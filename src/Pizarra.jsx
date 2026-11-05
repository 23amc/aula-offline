import { useRef, useState } from 'react'
import PanelLateral from './PanelLateral'

// Resolución fija: el dibujo no se pierde al plegar la pizarra ni al girar el móvil.
const ANCHO = 1200
const ALTO = 1600
const GROSOR = 14
const GROSOR_GOMA = 70
const BLANCO = '#ffffff'

const COLORES = [
  { nombre: 'Negro', valor: '#111827' },
  { nombre: 'Azul', valor: '#2563eb' },
  { nombre: 'Rojo', valor: '#dc2626' },
  { nombre: 'Verde', valor: '#16a34a' },
  { nombre: 'Amarillo', valor: '#facc15' },
  { nombre: 'Morado', valor: '#9333ea' },
]

export default function Pizarra({ abierta, onAlternar }) {
  const [color, setColor] = useState(COLORES[0].valor)
  const lienzo = useRef(null)
  const punteroActivo = useRef(null)

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

  function borrarTodo() {
    lienzo.current.getContext('2d').clearRect(0, 0, ANCHO, ALTO)
  }

  return (
    <PanelLateral nombre="Pizarra" posicion="arriba" abierto={abierta} onAlternar={onAlternar}>
        <div className="pizarra-colores">
          {COLORES.map((c) => (
            <button
              key={c.valor}
              className="pizarra-color"
              style={{ background: c.valor }}
              aria-label={c.nombre}
              aria-pressed={color === c.valor}
              onClick={() => setColor(c.valor)}
            />
          ))}
          <button className="pizarra-goma secundario" aria-pressed={color === BLANCO} onClick={() => setColor(BLANCO)}>Goma</button>
          <button className="pizarra-borrar" onClick={borrarTodo}>Borrar todo</button>
        </div>
        <canvas
          ref={lienzo}
          className="pizarra-lienzo"
          width={ANCHO}
          height={ALTO}
          aria-label="Pizarra para dibujar"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
        />
    </PanelLateral>
  )
}
