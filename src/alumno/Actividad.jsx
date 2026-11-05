import { useEffect, useRef, useState } from 'react'
import { barajar, barajarSinResolver, normalizarRespuesta, partesDeFrase, tipoDe } from './actividades'
import { corregirProblema, diagnosticar, esNumerica, explicarConIA, valorarConIA } from './correccion'
import Mascota from '../ia/Mascota'
import { activarIA, estadoIA, hayGPU, iaActivada, useIA } from '../ia/motorCompartido'
import { idiomaActual, t } from '../idiomas/i18n'

// El resultado nunca se indica solo con color: lleva símbolo y texto para lectores de pantalla.
function Marca({ correcta }) {
  return (
    <>
      <span aria-hidden="true">{correcta ? '✓ ' : '✗ '}</span>
      <span className="sr-only">{t(correcta ? 'correcto' : 'incorrecto')}: </span>
    </>
  )
}

const Anuncio = ({ texto }) => <p className="sr-only" role="status">{texto}</p>

function Opciones({ tarea, onResponder }) {
  const [elegida, setElegida] = useState(null)
  const respondida = elegida !== null

  function elegir(i) {
    setElegida(i)
    onResponder(i === tarea.correcta)
  }

  return (
    <>
      {tarea.opciones.map((texto, i) => {
        const esCorrecta = respondida && i === tarea.correcta
        const esFallo = respondida && i === elegida && !esCorrecta
        const clase = esCorrecta ? 'correcta' : esFallo ? 'incorrecta' : ''
        return (
          <button key={i} className={`respuesta ${clase}`} disabled={respondida} onClick={() => elegir(i)}>
            <span className="letra" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
            <span>{(esCorrecta || esFallo) && <Marca correcta={esCorrecta} />}{texto}</span>
          </button>
        )
      })}
      {respondida && elegida !== tarea.correcta && (
        <p className="solucion">{t('solucion', { texto: tarea.opciones[tarea.correcta] })}</p>
      )}
    </>
  )
}

function Emparejar({ tarea, onResponder }) {
  const { pares } = tarea
  // Banco de palabras barajado; cada elemento recuerda de qué pareja salió.
  const [banco] = useState(() => barajar(pares.map((par, i) => ({ texto: par.derecha, i }))))
  const [asignados, setAsignados] = useState(() => pares.map(() => null))
  const [activa, setActiva] = useState(0)
  const [comprobado, setComprobado] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const contenedor = useRef(null)
  const reenfocar = useRef(false)

  const usado = (b) => asignados.includes(b.i)
  const completo = asignados.every((a) => a !== null)
  const filaCorrecta = (fila) => pares[asignados[fila]]?.derecha === pares[fila].derecha

  // La palabra pulsada desaparece: el foco pasa a la siguiente para no perderse.
  useEffect(() => {
    if (!reenfocar.current) return
    reenfocar.current = false
    contenedor.current.querySelector('.banco button, button.comprobar')?.focus()
  }, [asignados])

  function tocarFila(fila) {
    setAsignados(asignados.map((a, y) => (y === fila ? null : a)))
    setActiva(fila)
  }

  function tocarPalabra(b) {
    const nuevos = asignados.map((a, y) => (y === activa ? b.i : a))
    reenfocar.current = true
    setAsignados(nuevos)
    setAnuncio(t('colocada', { palabra: b.texto, fila: pares[activa].izquierda }))
    const siguienteVacia = nuevos.indexOf(null)
    if (siguienteVacia !== -1) setActiva(siguienteVacia)
  }

  function comprobar() {
    setComprobado(true)
    onResponder(pares.every((_, fila) => filaCorrecta(fila)))
  }

  return (
    <div ref={contenedor}>
      <Anuncio texto={anuncio} />
      {pares.map((par, fila) => {
        const asignado = asignados[fila]
        const elegida = !comprobado && fila === activa
        const clase = comprobado ? (filaCorrecta(fila) ? 'correcta' : 'incorrecta') : elegida ? 'activa' : 'secundario'
        return (
          <div key={fila} className="fila-pareja">
            <span>{par.izquierda}</span>
            <button
              className={clase}
              disabled={comprobado}
              aria-pressed={elegida}
              aria-label={asignado === null
                ? t('filaVacia', { fila: par.izquierda })
                : t('filaUnida', { fila: par.izquierda, palabra: pares[asignado].derecha })}
              onClick={() => tocarFila(fila)}
            >
              {comprobado && <Marca correcta={filaCorrecta(fila)} />}
              {asignado === null ? '…' : pares[asignado].derecha}
            </button>
          </div>
        )
      })}

      {comprobado ? (
        pares.some((_, fila) => !filaCorrecta(fila)) && (
          <p className="solucion">
            {t('solucion', { texto: pares.map((p) => `${p.izquierda} → ${p.derecha}`).join(', ') })}
          </p>
        )
      ) : (
        <>
          <p className="ayuda">{t('ayudaEmparejar')}</p>
          <div className="banco" role="group" aria-label={t('palabrasDisponibles')}>
            {banco.filter((b) => !usado(b)).map((b) => (
              <button key={b.i} onClick={() => tocarPalabra(b)}>{b.texto}</button>
            ))}
          </div>
          <button className="comprobar" disabled={!completo} onClick={comprobar}>{t('comprobar')}</button>
        </>
      )}
    </div>
  )
}

function Unir({ tarea, onResponder }) {
  const { pares } = tarea
  const [derecha] = useState(() =>
    barajarSinResolver(pares.map((p) => p.derecha), (lista) => lista.every((texto, i) => texto === pares[i].derecha))
  )
  // Para cada elemento de la izquierda, la posición de la derecha a la que apunta.
  const [uniones, setUniones] = useState(() => pares.map(() => null))
  const [origen, setOrigen] = useState(0)
  const [comprobado, setComprobado] = useState(false)
  const [anuncio, setAnuncio] = useState('')

  const completo = uniones.every((u) => u !== null)
  const unionCorrecta = (i) => derecha[uniones[i]] === pares[i].derecha
  const altura = (posicion) => `${((posicion + 0.5) / pares.length) * 100}%`
  const unidoA = (posicion) => uniones.indexOf(posicion)

  function tocarIzquierda(i) {
    setUniones(uniones.map((u, y) => (y === i ? null : u)))
    setOrigen(i)
  }

  function tocarDerecha(posicion) {
    // Una posición ya unida a otro elemento pasa al que se está uniendo ahora.
    const nuevas = uniones.map((u, y) => (y === origen ? posicion : u === posicion ? null : u))
    setUniones(nuevas)
    setAnuncio(t('unidoCon', { a: pares[origen].izquierda, b: derecha[posicion] }))
    const siguiente = nuevas.indexOf(null)
    if (siguiente !== -1) setOrigen(siguiente)
  }

  function comprobar() {
    setComprobado(true)
    onResponder(pares.every((_, i) => unionCorrecta(i)))
  }

  return (
    <div>
      <Anuncio texto={anuncio} />
      <p className="ayuda">{t('ayudaUnir')}</p>
      {/* Las flechas siempre van de izquierda a derecha, también en idiomas que se leen al revés. */}
      <div className="unir" dir="ltr" style={{ gridTemplateRows: `repeat(${pares.length}, 1fr)` }}>
        {pares.map((par, i) => {
          const clase = comprobado ? (unionCorrecta(i) ? 'correcta' : 'incorrecta') : i === origen && !completo ? 'activa' : 'secundario'
          return (
            <button
              key={i}
              className={clase}
              style={{ gridColumn: 1, gridRow: i + 1 }}
              disabled={comprobado}
              aria-pressed={i === origen && !completo}
              aria-label={uniones[i] === null ? par.izquierda : t('unidoCon', { a: par.izquierda, b: derecha[uniones[i]] })}
              onClick={() => tocarIzquierda(i)}
            >
              {comprobado && <Marca correcta={unionCorrecta(i)} />}{par.izquierda}
            </button>
          )
        })}
        <div className="unir-flechas" aria-hidden="true">
          <svg>
            <defs>
              {[['azul', '#2563eb'], ['verde', '#15803d'], ['rojo', '#dc2626']].map(([nombre, color]) => (
                <marker key={nombre} id={`punta-${nombre}`} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
                  <path d="M0 0 L12 6 L0 12 z" fill={color} />
                </marker>
              ))}
            </defs>
            {uniones.map((u, i) => {
              if (u === null) return null
              const color = !comprobado ? 'azul' : unionCorrecta(i) ? 'verde' : 'rojo'
              return <line key={i} className={`flecha flecha-${color}`} x1="0%" y1={altura(i)} x2="100%" y2={altura(u)} markerEnd={`url(#punta-${color})`} />
            })}
          </svg>
        </div>
        {derecha.map((texto, posicion) => (
          <button
            key={posicion}
            className="secundario"
            style={{ gridColumn: 3, gridRow: posicion + 1 }}
            disabled={comprobado}
            aria-label={unidoA(posicion) === -1 ? texto : t('unidoCon', { a: texto, b: pares[unidoA(posicion)].izquierda })}
            onClick={() => tocarDerecha(posicion)}
          >{texto}</button>
        ))}
      </div>
      {comprobado ? (
        pares.some((_, i) => !unionCorrecta(i)) && (
          <p className="solucion">{t('solucion', { texto: pares.map((p) => `${p.izquierda} → ${p.derecha}`).join(', ') })}</p>
        )
      ) : (
        <button className="comprobar" disabled={!completo} onClick={comprobar}>{t('comprobar')}</button>
      )}
    </div>
  )
}

function Ordenar({ tarea, onResponder }) {
  const { pasos } = tarea
  const [orden, setOrden] = useState(() =>
    barajarSinResolver(pasos.map((_, i) => i), (lista) => lista.every((p, i) => pasos[p] === pasos[i]))
  )
  const [comprobado, setComprobado] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const lista = useRef(null)
  const enfocar = useRef(null)

  const enSuSitio = (posicion) => pasos[orden[posicion]] === pasos[posicion]

  // El elemento cambia de sitio y el navegador puede soltar el foco: se le devuelve.
  useEffect(() => {
    if (!enfocar.current) return
    lista.current.querySelector(`[data-foco="${enfocar.current}"]`)?.focus()
    enfocar.current = null
  }, [orden])

  function mover(posicion, delta, direccion) {
    const destino = posicion + delta
    if (destino < 0 || destino >= orden.length) return
    const nuevo = [...orden]
    ;[nuevo[posicion], nuevo[destino]] = [nuevo[destino], nuevo[posicion]]
    enfocar.current = `${orden[posicion]}-${direccion}`
    setOrden(nuevo)
    setAnuncio(t('movido', { texto: pasos[orden[posicion]], n: destino + 1 }))
  }

  function comprobar() {
    setComprobado(true)
    onResponder(orden.every((_, posicion) => enSuSitio(posicion)))
  }

  return (
    <div>
      <Anuncio texto={anuncio} />
      <ol className="lista-orden" ref={lista}>
        {orden.map((indice, posicion) => (
          <li key={indice} className={comprobado ? (enSuSitio(posicion) ? 'bien' : 'mal') : ''}>
            <span>{comprobado && <Marca correcta={enSuSitio(posicion)} />}{pasos[indice]}</span>
            {!comprobado && (
              <span className="flechas">
                {/* aria-disabled en lugar de disabled: un botón desactivado perdería el foco del teclado. */}
                <button className="secundario" data-foco={`${indice}-subir`} aria-label={t('subir', { texto: pasos[indice] })} aria-disabled={posicion === 0} onClick={() => mover(posicion, -1, 'subir')}>↑</button>
                <button className="secundario" data-foco={`${indice}-bajar`} aria-label={t('bajar', { texto: pasos[indice] })} aria-disabled={posicion === orden.length - 1} onClick={() => mover(posicion, 1, 'bajar')}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {comprobado ? (
        orden.some((_, posicion) => !enSuSitio(posicion)) && (
          <p className="solucion">{t('solucion', { texto: pasos.map((p, i) => `${i + 1}. ${p}`).join(' ') })}</p>
        )
      ) : (
        <button className="comprobar" onClick={comprobar}>{t('comprobar')}</button>
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
    if (escritas.some((x) => !x.trim())) return
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
              <>
                {comprobado && <Marca correcta={huecoCorrecto(i)} />}
                <input
                  className={`hueco ${comprobado ? (huecoCorrecto(i) ? 'bien' : 'mal') : ''}`}
                  aria-label={t('hueco', { n: i + 1, frase: tarea.frase.replace(/_{3,}/g, '…') })}
                  aria-invalid={comprobado ? !huecoCorrecto(i) : undefined}
                  value={escritas[i]}
                  disabled={comprobado}
                  autoComplete="off"
                  onChange={(e) => setEscritas(escritas.map((x, y) => (y === i ? e.target.value : x)))}
                />
              </>
            )}
          </span>
        ))}
      </p>
      {comprobado ? (
        tarea.respuestas.some((_, i) => !huecoCorrecto(i)) && (
          <p className="solucion">{t('solucion', { texto: tarea.respuestas.join(', ') })}</p>
        )
      ) : (
        <button type="submit" className="comprobar" disabled={escritas.some((x) => !x.trim())}>{t('comprobar')}</button>
      )}
    </form>
  )
}

function PasosSolucion({ pasos, abierto = false }) {
  if (!pasos?.length) return null
  return (
    <details className="pasos-solucion" open={abierto}>
      <summary>{t('comoSeResuelve')}</summary>
      <ol>{pasos.map((paso, i) => <li key={i}>{paso}</li>)}</ol>
    </details>
  )
}

// Respuesta escrita: la nota la pone siempre la corrección exacta; la IA, si está activa, explica el error.
function Problema({ tarea, onResponder }) {
  const ia = useIA()
  const [escrito, setEscrito] = useState('')
  const [correccion, setCorreccion] = useState(null)
  const [verPista, setVerPista] = useState(false)
  const [explicacion, setExplicacion] = useState('')
  const [explicando, setExplicando] = useState(false)
  const [comprobando, setComprobando] = useState(false)
  const numerica = esNumerica(tarea)

  async function explicar(texto = escrito) {
    setExplicando(true)
    setExplicacion('…')
    try {
      if (!(await activarIA())) throw new Error()
      const final = await explicarConIA(tarea, texto, setExplicacion)
      if (!final) setExplicacion('')
    } catch {
      setExplicacion('')
    }
    setExplicando(false)
  }

  async function comprobar(e) {
    e.preventDefault()
    const texto = escrito.trim()
    if (!texto || comprobando) return
    let r = corregirProblema(tarea, texto)
    if (!r.correcta && !numerica && estadoIA().fase === 'lista') {
      setComprobando(true)
      const valida = await valorarConIA(tarea, texto).catch(() => false)
      setComprobando(false)
      if (valida) r = { correcta: true, porIA: true }
    }
    setCorreccion({ ...r, diagnostico: diagnosticar(tarea, r) })
    onResponder(r.correcta)
    if (!r.correcta && estadoIA().fase === 'lista') explicar(texto)
  }

  const respuesta = `${tarea.respuesta}${tarea.unidad ? ` ${tarea.unidad}` : ''}`

  return (
    <form className="problema" onSubmit={comprobar}>
      <label className="problema-campo">
        <span className="sr-only">{t('tuRespuesta')}</span>
        <span className="problema-entrada">
          <input
            className={correccion ? (correccion.correcta ? 'bien' : 'mal') : ''}
            value={escrito}
            placeholder={t('escribeRespuesta')}
            disabled={Boolean(correccion)}
            inputMode={numerica ? 'decimal' : 'text'}
            autoComplete="off"
            aria-invalid={correccion ? !correccion.correcta : undefined}
            onChange={(e) => setEscrito(e.target.value)}
          />
          {tarea.unidad && <span className="unidad">{tarea.unidad}</span>}
        </span>
      </label>

      {!correccion && (
        <>
          {tarea.pista && (verPista
            ? <p className="pista" role="status"><span aria-hidden="true">💡 </span>{tarea.pista}</p>
            : <button type="button" className="secundario pista-boton" onClick={() => setVerPista(true)}>{t('verPista')}</button>)}
          <button type="submit" className="comprobar" disabled={!escrito.trim() || comprobando}>{comprobando ? t('corrigiendo') : t('comprobar')}</button>
        </>
      )}

      {correccion && (
        <div className={`correccion ${correccion.correcta ? 'bien' : 'mal'}`}>
          <p><Marca correcta={correccion.correcta} /><strong>{t('tuRespuestaFue', { texto: escrito.trim() })}</strong></p>
          {correccion.ortografia && <p>{t('ojoOrtografia', { palabra: correccion.ortografia })}</p>}
          {correccion.porIA && <p>{t('validadaPorIA', { texto: respuesta })}</p>}
          {!correccion.correcta && (
            <>
              {correccion.diagnostico && <p className="diagnostico">{correccion.diagnostico}</p>}
              <p className="solucion">{t('solucion', { texto: respuesta })}</p>
            </>
          )}
          <PasosSolucion pasos={tarea.pasos} abierto={!correccion.correcta} />
          {explicacion && (
            <div className="explicacion-ia" lang={idiomaActual().codigo} aria-live="polite" aria-busy={explicando}>
              <span className="mascota-mini"><Mascota estado={explicando ? 'pensando' : 'contenta'} /></span>
              <p>{explicacion}</p>
            </div>
          )}
          {!correccion.correcta && !explicacion && hayGPU && (ia.fase === 'lista' || iaActivada()) && (
            <button type="button" className="secundario" disabled={explicando || ia.ocupada} onClick={() => explicar()}>{t('explicameIA')}</button>
          )}
        </div>
      )}
    </form>
  )
}

const COMPONENTES = { opciones: Opciones, emparejar: Emparejar, unir: Unir, ordenar: Ordenar, huecos: Huecos, problema: Problema }

export default function Actividad({ tarea, onResponder }) {
  const Componente = COMPONENTES[tipoDe(tarea)]
  return <Componente tarea={tarea} onResponder={onResponder} />
}
