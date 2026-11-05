import { useEffect, useState } from 'react'
import { enfocarTitulo } from '../accesibilidad/accesibilidad'
import { contarHuecos, ILUSTRACIONES, limpiarTarea, TIPOS, tareaVacia, tipoDe, validarTarea } from '../alumno/actividades'
import { docenteGuardarLeccion, docenteResultados, leerLecciones, leerTests } from '../datos/almacen'
import Ilustracion from '../alumno/Ilustracion'

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
        Lección o test
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todas</option>
          {lecciones.map((l) => <option key={l.id} value={l.id}>{l.titulo}</option>)}
        </select>
      </label>
      <button className="secundario" onClick={() => setRecarga(recarga + 1)}>Actualizar notas</button>
      {error && <p className="error" role="alert">{error}</p>}
      {!resultados && !error && <p role="status">Cargando notas…</p>}
      {resultados && visibles.length === 0 && <p>Todavía no hay notas.</p>}
      {visibles.length > 0 && (
        <table className="notas">
          <caption className="sr-only">Notas de los alumnos</caption>
          <thead>
            <tr><th scope="col">Alumno</th><th scope="col">Lección</th><th scope="col">Nota</th><th scope="col">Fecha</th></tr>
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

function validar(leccion, esTest) {
  if (!leccion.asignatura.trim() || !leccion.titulo.trim()) return 'Completa la asignatura y el título.'
  if (!esTest && !leccion.texto.trim()) return 'Escribe el texto de la lección.'
  if (leccion.preguntas.length === 0) return 'Añade al menos una tarea.'
  for (const [i, p] of leccion.preguntas.entries()) {
    const problema = validarTarea(p, i + 1)
    if (problema) return problema
  }
  return null
}

function SelectorImagen({ valor, onCambiar }) {
  const predefinida = ILUSTRACIONES.some((i) => i.id === valor)
  return (
    <>
      <label>
        Imagen (opcional)
        <select value={valor ?? ''} onChange={(e) => onCambiar(e.target.value || undefined)}>
          <option value="">Sin imagen</option>
          {valor && !predefinida && <option value={valor}>Imagen actual</option>}
          {ILUSTRACIONES.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
      </label>
      <Ilustracion id={valor} />
    </>
  )
}

function ListaEditable({ elementos, min, textoAnadir, onAnadir, onQuitar, renderizar }) {
  return (
    <>
      {elementos.map((e, k) => (
        <div key={k} className="opcion">
          {renderizar(e, k)}
          <button
            type="button"
            className="secundario quitar"
            aria-label={`Quitar ${k + 1}`}
            disabled={elementos.length <= min}
            onClick={() => onQuitar(k)}
          >×</button>
        </div>
      ))}
      <button type="button" className="secundario" onClick={onAnadir}>{textoAnadir}</button>
    </>
  )
}

function EditorTarea({ tarea, numero, onCambiar, onQuitar }) {
  const tipo = tipoDe(tarea)
  const sustituir = (lista, k, valor) => lista.map((x, y) => (y === k ? valor : x))
  const sin = (lista, k) => lista.filter((_, y) => y !== k)

  function quitarOpcion(k) {
    const correcta = k === tarea.correcta ? 0 : k < tarea.correcta ? tarea.correcta - 1 : tarea.correcta
    onCambiar({ opciones: sin(tarea.opciones, k), correcta })
  }

  return (
    <fieldset className="tarea">
      <legend>Tarea {numero}</legend>
      <label>
        Tipo de actividad
        <select value={tipo} onChange={(e) => onCambiar({ ...tareaVacia(e.target.value, tarea.pregunta), imagen: tarea.imagen }, true)}>
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </label>
      <label>Enunciado<input value={tarea.pregunta} onChange={(e) => onCambiar({ pregunta: e.target.value })} /></label>
      <SelectorImagen valor={tarea.imagen} onCambiar={(imagen) => onCambiar({ imagen })} />

      {tipo === 'opciones' && (
        <>
          <p className="ayuda">Opciones (marca la correcta):</p>
          <ListaEditable
            elementos={tarea.opciones}
            min={2}
            textoAnadir="Añadir opción"
            onAnadir={() => onCambiar({ opciones: [...tarea.opciones, ''] })}
            onQuitar={quitarOpcion}
            renderizar={(o, k) => (
              <>
                <input
                  type="radio"
                  name={`correcta-${numero}`}
                  aria-label={`Opción ${k + 1} correcta`}
                  checked={tarea.correcta === k}
                  onChange={() => onCambiar({ correcta: k })}
                />
                <input aria-label={`Texto de la opción ${k + 1}`} value={o} onChange={(e) => onCambiar({ opciones: sustituir(tarea.opciones, k, e.target.value) })} />
              </>
            )}
          />
        </>
      )}

      {(tipo === 'emparejar' || tipo === 'unir') && (
        <>
          <p className="ayuda">Escribe las parejas correctas; al alumno se le mostrarán desordenadas.</p>
          <ListaEditable
            elementos={tarea.pares}
            min={2}
            textoAnadir="Añadir pareja"
            onAnadir={() => onCambiar({ pares: [...tarea.pares, { izquierda: '', derecha: '' }] })}
            onQuitar={(k) => onCambiar({ pares: sin(tarea.pares, k) })}
            renderizar={(par, k) => (
              <>
                <input aria-label={`Pareja ${k + 1}, primer elemento`} value={par.izquierda} onChange={(e) => onCambiar({ pares: sustituir(tarea.pares, k, { ...par, izquierda: e.target.value }) })} />
                <input aria-label={`Pareja ${k + 1}, segundo elemento`} value={par.derecha} onChange={(e) => onCambiar({ pares: sustituir(tarea.pares, k, { ...par, derecha: e.target.value }) })} />
              </>
            )}
          />
        </>
      )}

      {tipo === 'ordenar' && (
        <>
          <p className="ayuda">Escribe los pasos en el orden correcto; al alumno se le mostrarán desordenados.</p>
          <ListaEditable
            elementos={tarea.pasos}
            min={2}
            textoAnadir="Añadir paso"
            onAnadir={() => onCambiar({ pasos: [...tarea.pasos, ''] })}
            onQuitar={(k) => onCambiar({ pasos: sin(tarea.pasos, k) })}
            renderizar={(paso, k) => (
              <input aria-label={`Paso ${k + 1}`} value={paso} onChange={(e) => onCambiar({ pasos: sustituir(tarea.pasos, k, e.target.value) })} />
            )}
          />
        </>
      )}

      {tipo === 'huecos' && (
        <>
          <label>
            Frase (escribe ___ en cada hueco)
            <input value={tarea.frase} onChange={(e) => onCambiar({ frase: e.target.value })} placeholder="El hielo es agua en estado ___" />
          </label>
          {Array.from({ length: contarHuecos(tarea.frase) }, (_, k) => (
            <label key={k}>
              Respuesta del hueco {k + 1}
              <input
                value={tarea.respuestas[k] ?? ''}
                onChange={(e) => {
                  const respuestas = Array.from({ length: contarHuecos(tarea.frase) }, (_, y) => tarea.respuestas[y] ?? '')
                  respuestas[k] = e.target.value
                  onCambiar({ respuestas })
                }}
              />
            </label>
          ))}
        </>
      )}

      <button type="button" className="secundario" onClick={onQuitar}>Quitar tarea</button>
    </fieldset>
  )
}

function EditorLeccion({ pin, inicial, esTest, onGuardada, onCancelar }) {
  const [leccion, setLeccion] = useState(inicial)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cambiarPregunta = (i, cambios, sustituirTodo = false) => setLeccion({
    ...leccion,
    preguntas: leccion.preguntas.map((p, j) => (j !== i ? p : sustituirTodo ? cambios : { ...p, ...cambios })),
  })

  async function guardar() {
    const problema = validar(leccion, esTest)
    if (problema) {
      setError(problema)
      return
    }
    setError('')
    setOcupado(true)
    const r = await docenteGuardarLeccion(pin, {
      ...leccion,
      texto: esTest ? leccion.titulo : leccion.texto, // El servidor exige texto; un test no lo muestra.
      preguntas: leccion.preguntas.map(limpiarTarea),
    }, { test: esTest })
    setOcupado(false)
    if (r.error) setError(r.error)
    else onGuardada()
  }

  return (
    <div>
      <h1>{esTest ? (leccion.id ? 'Modificar test' : 'Nuevo test') : (leccion.id ? 'Modificar lección' : 'Nueva lección')}</h1>
      <label>Asignatura<input value={leccion.asignatura} onChange={(e) => setLeccion({ ...leccion, asignatura: e.target.value })} /></label>
      <label>Título<input value={leccion.titulo} onChange={(e) => setLeccion({ ...leccion, titulo: e.target.value })} /></label>
      {!esTest && (
        <label>Texto de la lección<textarea rows={6} value={leccion.texto} onChange={(e) => setLeccion({ ...leccion, texto: e.target.value })} /></label>
      )}

      <h2>Tareas</h2>
      {leccion.preguntas.map((p, i) => (
        <EditorTarea
          key={i}
          tarea={p}
          numero={i + 1}
          onCambiar={(cambios, sustituirTodo) => cambiarPregunta(i, cambios, sustituirTodo)}
          onQuitar={() => setLeccion({ ...leccion, preguntas: leccion.preguntas.filter((_, j) => j !== i) })}
        />
      ))}
      <button type="button" className="secundario" onClick={() => setLeccion({ ...leccion, preguntas: [...leccion.preguntas, tareaVacia('opciones')] })}>Añadir tarea</button>

      {error && <p className="error" role="alert">{error}</p>}
      <button onClick={guardar} disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar'}</button>
      <button className="secundario" onClick={onCancelar}>Cancelar</button>
    </div>
  )
}

function ListaContenido({ aviso, textoAnadir, ayuda, elementos, unidad, onAnadir, onAbrir }) {
  return (
    <div>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      <button onClick={onAnadir}>{textoAnadir}</button>
      <p className="ayuda">{ayuda}</p>
      {elementos.map((l) => (
        <button key={l.id} className="secundario" onClick={() => onAbrir(l)}>
          {l.asignatura}: {l.titulo} ({l.preguntas.length} {unidad})
        </button>
      ))}
    </div>
  )
}

export default function PanelDocente({ pin, online, onSalir, onLeccionesCambiadas }) {
  const [seccion, setSeccion] = useState('notas')
  const [editando, setEditando] = useState(null)
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [tests, setTests] = useState(leerTests)
  const [aviso, setAviso] = useState('')

  const esTest = seccion === 'tests'
  const vacia = () => ({ asignatura: '', titulo: '', texto: '', preguntas: [tareaVacia('opciones')] })

  function guardada() {
    setLecciones(leerLecciones())
    setTests(leerTests())
    setEditando(null)
    setAviso(`${esTest ? 'Test guardado' : 'Lección guardada'}. Los alumnos lo recibirán al sincronizar.`)
    onLeccionesCambiadas()
  }

  function abrirEditor(contenido) {
    setAviso('')
    setEditando(contenido)
  }

  function cambiarSeccion(nueva) {
    setAviso('')
    setSeccion(nueva)
  }

  // El editor sustituye a la lista: el foco va a su título.
  const hayEditor = Boolean(editando)
  useEffect(() => {
    enfocarTitulo()
  }, [hayEditor])

  if (editando) {
    // Los tests incluidos en la app no traen campo de texto.
    return <EditorLeccion pin={pin} inicial={{ texto: '', ...editando }} esTest={esTest} onGuardada={guardada} onCancelar={() => setEditando(null)} />
  }

  return (
    <div>
      <h1>Panel del profesor</h1>
      {!online && <p className="error">Sin conexión: el panel necesita internet para ver notas y guardar cambios.</p>}
      <div className="pestanas">
        <button className={seccion === 'notas' ? '' : 'secundario'} aria-pressed={seccion === 'notas'} onClick={() => cambiarSeccion('notas')}>Notas</button>
        <button className={seccion === 'lecciones' ? '' : 'secundario'} aria-pressed={seccion === 'lecciones'} onClick={() => cambiarSeccion('lecciones')}>Lecciones</button>
        <button className={esTest ? '' : 'secundario'} aria-pressed={esTest} onClick={() => cambiarSeccion('tests')}>Tests</button>
      </div>

      {seccion === 'notas' && <Notas pin={pin} lecciones={[...lecciones, ...tests]} />}

      {seccion === 'lecciones' && (
        <ListaContenido
          aviso={aviso}
          textoAnadir="Añadir lección"
          ayuda="Toca una lección para modificar su texto y sus actividades:"
          elementos={lecciones}
          unidad="tareas"
          onAnadir={() => abrirEditor(vacia())}
          onAbrir={abrirEditor}
        />
      )}

      {esTest && (
        <ListaContenido
          aviso={aviso}
          textoAnadir="Añadir test"
          ayuda="Cada test es un banco de preguntas: en cada intento, al alumno le salen 10 al azar."
          elementos={tests}
          unidad="preguntas"
          onAnadir={() => abrirEditor(vacia())}
          onAbrir={abrirEditor}
        />
      )}

      <button className="secundario" onClick={onSalir}>Salir del panel</button>
    </div>
  )
}
