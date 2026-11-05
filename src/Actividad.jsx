import { useState } from 'react'
import { barajar, normalizarRespuesta, partesDeFrase, tipoDe } from './actividades'

function Opciones({ tarea, onResponder }) {
  const [elegida, setElegida] = useState(null)
  const respondida = elegida !== null

  function elegir(i) {
    setElegida(i)
    onResponder(i === tarea.correcta)
  }

  return tarea.opciones.map((texto, i) => {
    const esCorrecta = respondida && i === tarea.correcta
    const esFallo = respondida && i === elegida && !esCorrecta
    const clase = esCorrecta ? 'correcta' : esFallo ? 'incorrecta' : respondida ? 'secundario' : ''
    return (
      <button key={i} className={clase} disabled={respondida} onClick={() => elegir(i)}>
        {esCorrecta && '✓ '}{esFallo && '✗ '}{texto}
      </button>
    )
  })
}

function Emparejar({ tarea, onResponder }) {
  const { pares } = tarea
  // Banco de palabras barajado; cada elemento recuerda de qué pareja salió.
  const [banco] = useState(() => barajar(pares.map((par, i) => ({ texto: par.derecha, i }))))
  const [asignados, setAsignados] = useState(() => pares.map(() => null))
  const [activa, setActiva] = useState(0)
  const [comprobado, setComprobado] = useState(false)

  const usado = (b) => asignados.includes(b.i)
  const completo = asignados.every((a) => a !== null)
  const filaCorrecta = (fila) => pares[asignados[fila]]?.derecha === pares[fila].derecha

  function tocarFila(fila) {
    setAsignados(asignados.map((a, y) => (y === fila ? null : a)))
    setActiva(fila)
  }

  function tocarPalabra(b) {
    const nuevos = asignados.map((a, y) => (y === activa ? b.i : a))
    setAsignados(nuevos)
    const siguienteVacia = nuevos.indexOf(null)
    if (siguienteVacia !== -1) setActiva(siguienteVacia)
  }

  function comprobar() {
    setComprobado(true)
    onResponder(pares.every((_, fila) => filaCorrecta(fila)))
  }

  return (
    <div>
      {pares.map((par, fila) => {
        const asignado = asignados[fila]
        const clase = comprobado ? (filaCorrecta(fila) ? 'correcta' : 'incorrecta') : fila === activa ? 'activa' : 'secundario'
        return (
          <div key={fila} className="fila-pareja">
            <span>{par.izquierda}</span>
            <button className={clase} disabled={comprobado} onClick={() => tocarFila(fila)}>
              {asignado === null ? '…' : pares[asignado].derecha}
            </button>
          </div>
        )
      })}

      {comprobado ? (
        pares.some((_, fila) => !filaCorrecta(fila)) && (
          <p className="solucion">
            Correcto: {pares.map((p) => `${p.izquierda} → ${p.derecha}`).join(', ')}
          </p>
        )
      ) : (
        <>
          <p className="ayuda">Toca una palabra para colocarla:</p>
          <div className="banco">
            {banco.filter((b) => !usado(b)).map((b) => (
              <button key={b.i} onClick={() => tocarPalabra(b)}>{b.texto}</button>
            ))}
          </div>
          <button className="comprobar" disabled={!completo} onClick={comprobar}>Comprobar</button>
        </>
      )}
    </div>
  )
}

function Ordenar({ tarea, onResponder }) {
  const { pasos } = tarea
  const [orden, setOrden] = useState(() => {
    const indices = pasos.map((_, i) => i)
    // Se reintenta para no mostrarlo ya resuelto.
    let barajado = barajar(indices)
    for (let intento = 0; intento < 10 && barajado.every((p, i) => pasos[p] === pasos[i]); intento++) {
      barajado = barajar(indices)
    }
    return barajado
  })
  const [comprobado, setComprobado] = useState(false)

  const enSuSitio = (posicion) => pasos[orden[posicion]] === pasos[posicion]

  function mover(posicion, delta) {
    const nuevo = [...orden]
    ;[nuevo[posicion], nuevo[posicion + delta]] = [nuevo[posicion + delta], nuevo[posicion]]
    setOrden(nuevo)
  }

  function comprobar() {
    setComprobado(true)
    onResponder(orden.every((_, posicion) => enSuSitio(posicion)))
  }

  return (
    <div>
      <ol className="lista-orden">
        {orden.map((indice, posicion) => (
          <li key={indice} className={comprobado ? (enSuSitio(posicion) ? 'bien' : 'mal') : ''}>
            <span>{pasos[indice]}</span>
            {!comprobado && (
              <span className="flechas">
                <button className="secundario" aria-label={`Subir: ${pasos[indice]}`} disabled={posicion === 0} onClick={() => mover(posicion, -1)}>↑</button>
                <button className="secundario" aria-label={`Bajar: ${pasos[indice]}`} disabled={posicion === orden.length - 1} onClick={() => mover(posicion, 1)}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {comprobado ? (
        orden.some((_, posicion) => !enSuSitio(posicion)) && (
          <p className="solucion">Correcto: {pasos.map((p, i) => `${i + 1}. ${p}`).join(' ')}</p>
        )
      ) : (
        <button className="comprobar" onClick={comprobar}>Comprobar</button>
      )}
    </div>
  )
}

function Huecos({ tarea, onResponder }) {
  const partes = partesDeFrase(tarea.frase)
  const [escritas, setEscritas] = useState(() => tarea.respuestas.map(() => ''))
  const [comprobado, setComprobado] = useState(false)

  const huecoCorrecto = (i) => normalizarRespuesta(escritas[i]) === normalizarRespuesta(tarea.respuestas[i])

  function comprobar(e) {
    e.preventDefault()
    setComprobado(true)
    onResponder(tarea.respuestas.every((_, i) => huecoCorrecto(i)))
  }

  return (
    <form onSubmit={comprobar}>
      <p className="frase">
        {partes.map((parte, i) => (
          <span key={i}>
            {parte}
            {i < partes.length - 1 && (
              <input
                className={`hueco ${comprobado ? (huecoCorrecto(i) ? 'bien' : 'mal') : ''}`}
                aria-label={`Hueco ${i + 1}`}
                value={escritas[i]}
                disabled={comprobado}
                autoComplete="off"
                onChange={(e) => setEscritas(escritas.map((x, y) => (y === i ? e.target.value : x)))}
              />
            )}
          </span>
        ))}
      </p>
      {comprobado ? (
        tarea.respuestas.some((_, i) => !huecoCorrecto(i)) && (
          <p className="solucion">Correcto: {tarea.respuestas.join(', ')}</p>
        )
      ) : (
        <button type="submit" className="comprobar" disabled={escritas.some((x) => !x.trim())}>Comprobar</button>
      )}
    </form>
  )
}

const COMPONENTES = { opciones: Opciones, emparejar: Emparejar, ordenar: Ordenar, huecos: Huecos }

export default function Actividad({ tarea, onResponder }) {
  const Componente = COMPONENTES[tipoDe(tarea)]
  return <Componente tarea={tarea} onResponder={onResponder} />
}
