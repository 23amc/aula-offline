import { useEffect, useState } from 'react'
import { docenteGuardarLeccion, docenteResultados, leerLecciones } from './datos'

const preguntaVacia = () => ({ pregunta: '', opciones: ['', '', ''], correcta: 0 })

function Notas({ pin, lecciones }) {
  const [resultados, setResultados] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let vigente = true
    docenteResultados(pin).then((r) => {
      if (!vigente) return
      setError(r.error ?? '')
      if (r.resultados) setResultados(r.resultados)
    })
    return () => {
      vigente = false
    }
  }, [pin, recarga])

  const tituloDe = (id) => lecciones.find((l) => l.id === id)?.titulo ?? id
  const visibles = (resultados ?? []).filter((r) => !filtro || r.leccion === filtro)

  return (
    <div>
      <label>
        Lección
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas</option>
          {lecciones.map((l) => <option key={l.id} value={l.id}>{l.titulo}</option>)}
        </select>
      </label>
      <button className="secundario" onClick={() => setRecarga(recarga + 1)}>Actualizar notas</button>
      {error && <p className="error" role="alert">{error}</p>}
      {!resultados && !error && <p>Cargando notas…</p>}
      {resultados && visibles.length === 0 && <p>Todavía no hay notas.</p>}
      {visibles.length > 0 && (
        <table className="notas">
          <thead>
            <tr><th>Alumno</th><th>Lección</th><th>Nota</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.id}>
                <td>{r.alias}</td>
                <td>{tituloDe(r.leccion)}</td>
                <td>{r.puntos}/{r.total}</td>
                <td>{new Date(r.fecha).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function validar(leccion) {
  if (!leccion.asignatura.trim() || !leccion.titulo.trim() || !leccion.texto.trim()) {
    return 'Completa la asignatura, el título y el texto.'
  }
  if (leccion.preguntas.length === 0) return 'Añade al menos una tarea.'
  for (const [i, p] of leccion.preguntas.entries()) {
    if (!p.pregunta.trim()) return `Escribe el enunciado de la tarea ${i + 1}.`
    if (p.opciones.length < 2 || p.opciones.some((o) => !o.trim())) {
      return `La tarea ${i + 1} necesita al menos 2 opciones, todas con texto.`
    }
  }
  return null
}

function EditorLeccion({ pin, inicial, onGuardada, onCancelar }) {
  const [leccion, setLeccion] = useState(inicial)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cambiarPregunta = (i, cambios) => setLeccion({
    ...leccion,
    preguntas: leccion.preguntas.map((p, j) => (j === i ? { ...p, ...cambios } : p)),
  })

  function quitarOpcion(i, k) {
    const p = leccion.preguntas[i]
    const correcta = k === p.correcta ? 0 : k < p.correcta ? p.correcta - 1 : p.correcta
    cambiarPregunta(i, { opciones: p.opciones.filter((_, x) => x !== k), correcta })
  }

  async function guardar() {
    const problema = validar(leccion)
    if (problema) {
      setError(problema)
      return
    }
    setError('')
    setOcupado(true)
    const r = await docenteGuardarLeccion(pin, leccion)
    setOcupado(false)
    if (r.error) setError(r.error)
    else onGuardada()
  }

  return (
    <div>
      <h2>{leccion.id ? 'Modificar lección' : 'Nueva lección'}</h2>
      <label>Asignatura<input value={leccion.asignatura} onChange={(e) => setLeccion({ ...leccion, asignatura: e.target.value })} /></label>
      <label>Título<input value={leccion.titulo} onChange={(e) => setLeccion({ ...leccion, titulo: e.target.value })} /></label>
      <label>Texto de la lección<textarea rows={6} value={leccion.texto} onChange={(e) => setLeccion({ ...leccion, texto: e.target.value })} /></label>

      <h2>Tareas</h2>
      {leccion.preguntas.map((p, i) => (
        <fieldset key={i} className="tarea">
          <legend>Tarea {i + 1}</legend>
          <label>Enunciado<input value={p.pregunta} onChange={(e) => cambiarPregunta(i, { pregunta: e.target.value })} /></label>
          <p className="ayuda">Opciones (marca la correcta):</p>
          {p.opciones.map((o, k) => (
            <div key={k} className="opcion">
              <input
                type="radio"
                name={`correcta-${i}`}
                aria-label={`Opción ${k + 1} correcta`}
                checked={p.correcta === k}
                onChange={() => cambiarPregunta(i, { correcta: k })}
              />
              <input
                aria-label={`Texto de la opción ${k + 1}`}
                value={o}
                onChange={(e) => cambiarPregunta(i, { opciones: p.opciones.map((x, y) => (y === k ? e.target.value : x)) })}
              />
              <button
                type="button"
                className="secundario quitar"
                aria-label={`Quitar opción ${k + 1}`}
                disabled={p.opciones.length <= 2}
                onClick={() => quitarOpcion(i, k)}
              >×</button>
            </div>
          ))}
          <button type="button" className="secundario" onClick={() => cambiarPregunta(i, { opciones: [...p.opciones, ''] })}>Añadir opción</button>
          <button
            type="button"
            className="secundario"
            onClick={() => setLeccion({ ...leccion, preguntas: leccion.preguntas.filter((_, j) => j !== i) })}
          >Quitar tarea</button>
        </fieldset>
      ))}
      <button type="button" className="secundario" onClick={() => setLeccion({ ...leccion, preguntas: [...leccion.preguntas, preguntaVacia()] })}>Añadir tarea</button>

      {error && <p className="error" role="alert">{error}</p>}
      <button onClick={guardar} disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar'}</button>
      <button className="secundario" onClick={onCancelar}>Cancelar</button>
    </div>
  )
}

export default function PanelDocente({ pin, online, onSalir, onLeccionesCambiadas }) {
  const [seccion, setSeccion] = useState('notas')
  const [editando, setEditando] = useState(null)
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [aviso, setAviso] = useState('')

  function guardada() {
    setLecciones(leerLecciones())
    setEditando(null)
    setAviso('Lección guardada. Los alumnos la recibirán al sincronizar.')
    onLeccionesCambiadas()
  }

  function abrirEditor(leccion) {
    setAviso('')
    setEditando(leccion)
  }

  if (editando) {
    return <EditorLeccion pin={pin} inicial={editando} onGuardada={guardada} onCancelar={() => setEditando(null)} />
  }

  return (
    <div>
      <h1>Panel del profesor</h1>
      {!online && <p className="error">Sin conexión: el panel necesita internet para ver notas y guardar cambios.</p>}
      <div className="pestanas">
        <button className={seccion === 'notas' ? '' : 'secundario'} onClick={() => setSeccion('notas')}>Notas</button>
        <button className={seccion === 'lecciones' ? '' : 'secundario'} onClick={() => setSeccion('lecciones')}>Lecciones y tareas</button>
      </div>

      {seccion === 'notas' && <Notas pin={pin} lecciones={lecciones} />}

      {seccion === 'lecciones' && (
        <div>
          {aviso && <p className="aviso" role="status">{aviso}</p>}
          <button onClick={() => abrirEditor({ asignatura: '', titulo: '', texto: '', preguntas: [preguntaVacia()] })}>Añadir lección</button>
          <p className="ayuda">Toca una lección para modificar su texto y sus tareas:</p>
          {lecciones.map((l) => (
            <button key={l.id} className="secundario" onClick={() => abrirEditor(l)}>
              {l.asignatura}: {l.titulo} ({l.preguntas.length} tareas)
            </button>
          ))}
        </div>
      )}

      <button className="secundario" onClick={onSalir}>Salir del panel</button>
    </div>
  )
}
