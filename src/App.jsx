import { useCallback, useEffect, useState } from 'react'
import Acceso from './Acceso'
import { claveTarea } from './actividades'
import Actividad from './Actividad'
import Asistente from './Asistente'
import Ilustracion from './Ilustracion'
import Mascota from './Mascota'
import MenuAlumno from './MenuAlumno'
import Pizarra from './Pizarra'
import PanelDocente from './PanelDocente'
import {
  cambiarAlias,
  cerrarSesion,
  contarPendientes,
  elegirPreguntasTest,
  cuentaActual,
  guardarResultado,
  leerLecciones,
  leerTests,
  registrarRespuesta,
  sincronizar,
  tareasParaReforzar,
} from './datos'
import logo from './assets/logo.png'
import './App.css'

const DURACION_PORTADA = 1500
const ID_REFUERZO = 'refuerzo'

function BarraProgreso({ completadas, total }) {
  return (
    <div className="progreso" role="progressbar" aria-label="Progreso de la lección" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completadas}>
      <div className="progreso-relleno" style={{ width: `${(completadas / total) * 100}%` }} />
    </div>
  )
}

export default function App() {
  const [portada, setPortada] = useState(true)
  const [versionNueva, setVersionNueva] = useState(false)
  const [cuenta, setCuenta] = useState(cuentaActual)
  const [pinDocente, setPinDocente] = useState(null)
  const [pantalla, setPantalla] = useState(cuenta ? 'menu' : 'acceso')
  const [pasoAcceso, setPasoAcceso] = useState('inicio')
  const [seccion, setSeccion] = useState('lecciones')
  const [panel, setPanel] = useState(null)
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [tests, setTests] = useState(leerTests)
  const [leccion, setLeccion] = useState(null)
  const [actual, setActual] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [acierto, setAcierto] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [nuevoAlias, setNuevoAlias] = useState('')
  const [errorAlias, setErrorAlias] = useState('')

  const refrescar = useCallback(() => {
    setLecciones(leerLecciones())
    setTests(leerTests())
    setCuenta(cuentaActual())
  }, [])

  const sincronizarYRefrescar = () => sincronizar().then(refrescar)

  useEffect(() => {
    const conectar = () => {
      setOnline(true)
      sincronizar().then(refrescar)
    }
    const desconectar = () => setOnline(false)
    window.addEventListener('online', conectar)
    window.addEventListener('offline', desconectar)
    sincronizar().then(refrescar)
    return () => {
      window.removeEventListener('online', conectar)
      window.removeEventListener('offline', desconectar)
    }
  }, [refrescar])

  useEffect(() => {
    const temporizador = setTimeout(() => setPortada(false), DURACION_PORTADA)
    return () => clearTimeout(temporizador)
  }, [])

  // Con cada publicación, el service worker descarga la versión nueva y toma el control.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker
    // Sin controlador previo es la primera instalación: la página ya es la última versión.
    const habiaVersion = Boolean(sw.controller)
    const alCambiar = () => {
      if (habiaVersion) setVersionNueva(true)
    }
    // Una app que vuelve del segundo plano no navega, así que hay que pedirle que compruebe.
    const alVolver = () => {
      if (document.visibilityState === 'visible') sw.getRegistration().then((r) => r?.update()).catch(() => {})
    }
    sw.addEventListener('controllerchange', alCambiar)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      sw.removeEventListener('controllerchange', alCambiar)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  // Solo se recarga en pantallas sin trabajo a medias; en un quiz, al volver al menú.
  useEffect(() => {
    if (versionNueva && (pantalla === 'menu' || pantalla === 'acceso')) window.location.reload()
  }, [versionNueva, pantalla])

  function entrarComoAlumno(c) {
    setCuenta(c)
    setPantalla('menu')
    sincronizarYRefrescar()
  }

  function entrarComoDocente(pin) {
    setPinDocente(pin)
    setPantalla('docente')
  }

  function salirDocente() {
    setPinDocente(null)
    setPanel(null)
    setPasoAcceso('inicio')
    setPantalla('acceso')
  }

  function salirAlumno() {
    cerrarSesion()
    setCuenta(null)
    setPanel(null)
    setPasoAcceso('inicio')
    setPantalla('acceso')
  }

  function guardarNuevoAlias() {
    const r = cambiarAlias(cuenta, nuevoAlias)
    setErrorAlias(r.error ?? '')
    if (r.cuenta) {
      setCuenta(r.cuenta)
      setNuevoAlias('')
      sincronizarYRefrescar()
    }
  }

  function empezar(l, destino) {
    setLeccion(l)
    setActual(0)
    setPuntos(0)
    setAcierto(null)
    setPantalla(destino)
  }

  function empezarTest(test) {
    empezar({ ...test, preguntas: elegirPreguntasTest(cuenta.alias, test) }, 'quiz')
  }

  function repetir() {
    const test = tests.find((t) => t.id === leccion.id)
    if (test) empezarTest(test)
    else empezar(leccion, 'quiz')
  }

  function empezarRefuerzo() {
    empezar({ id: ID_REFUERZO, preguntas: tareasParaReforzar(cuenta.alias, [...lecciones, ...tests]) }, 'quiz')
  }

  function responder(correcta) {
    const tarea = leccion.preguntas[actual]
    registrarRespuesta(cuenta.alias, tarea.clave ?? claveTarea(leccion.id, tarea), correcta)
    setAcierto(correcta)
    if (correcta) setPuntos(puntos + 1)
  }

  function siguiente() {
    setAcierto(null)
    if (actual + 1 < leccion.preguntas.length) {
      setActual(actual + 1)
    } else if (leccion.id === ID_REFUERZO) {
      // El refuerzo es práctica: no cuenta como nota para el profesor.
      setPantalla('fin')
    } else {
      guardarResultado({
        alias: cuenta.alias,
        leccion: leccion.id,
        puntos,
        total: leccion.preguntas.length,
        fecha: new Date().toISOString(),
      })
      setPantalla('fin')
      sincronizarYRefrescar()
    }
  }

  function alternarPanel(nombre) {
    setPanel(panel === nombre ? null : nombre)
  }

  const enActividad = pantalla === 'leccion' || pantalla === 'quiz' || pantalla === 'fin'
  const enTest = pantalla === 'quiz' && tests.some((t) => t.id === leccion?.id)
  // Solo una lección real da contexto: los tests y el refuerzo no tienen texto que explicar.
  const leccionAbierta = enActividad && lecciones.some((l) => l.id === leccion?.id) ? leccion : null

  const pendientes = cuenta ? contarPendientes(cuenta.alias) : 0

  if (portada) {
    return (
      <div className="portada">
        <img src={logo} alt="" />
        <h1>EduGo</h1>
      </div>
    )
  }

  return (
    <div className={pantalla === 'acceso' ? 'app' : 'app con-pizarra'}>
      <div className="barra">
        {!(pantalla === 'acceso' && pasoAcceso === 'inicio') && <img className="logo-mini" src={logo} alt="EduGo" />}
        <div className={online ? 'estado conectado' : 'estado sin-conexion'}>
          {online ? 'Con conexión' : 'Sin conexión: todo se guarda en tu móvil'}
        </div>
      </div>

      {/* Fuera de las pantallas para mantener el dibujo al navegar; al cerrar sesión se borra. */}
      {pantalla !== 'acceso' && (
        <>
          <Pizarra abierta={panel === 'pizarra'} onAlternar={() => alternarPanel('pizarra')} />
          <Asistente
            abierta={panel === 'ia'}
            onAlternar={() => alternarPanel('ia')}
            lecciones={lecciones}
            leccionActual={leccionAbierta}
            enTest={enTest}
          />
        </>
      )}

      {pantalla === 'acceso' && (
        <Acceso paso={pasoAcceso} onCambiarPaso={setPasoAcceso} onAlumno={entrarComoAlumno} onDocente={entrarComoDocente} />
      )}

      {pantalla === 'docente' && (
        <PanelDocente
          pin={pinDocente}
          online={online}
          onSalir={salirDocente}
          onLeccionesCambiadas={refrescar}
        />
      )}

      {pantalla === 'menu' && (
        <div>
          <h1>Hola, {cuenta.alias}</h1>
          {cuenta.conflicto && (
            <div className="conflicto">
              <p className="error" role="alert">
                Ya existe otra cuenta con este alias, así que tus notas no pueden enviarse. Elige otro alias; no perderás tus notas.
              </p>
              <input aria-label="Nuevo alias" value={nuevoAlias} maxLength={30} onChange={(e) => setNuevoAlias(e.target.value)} />
              {errorAlias && <p className="error" role="alert">{errorAlias}</p>}
              <button onClick={guardarNuevoAlias}>Cambiar alias</button>
            </div>
          )}
          <MenuAlumno
            seccion={seccion}
            lecciones={lecciones}
            tests={tests}
            refuerzo={tareasParaReforzar(cuenta.alias, [...lecciones, ...tests])}
            onSeccion={setSeccion}
            onLeer={(l) => empezar(l, 'leccion')}
            onTest={empezarTest}
            onRefuerzo={empezarRefuerzo}
          />
          <button className="secundario" onClick={salirAlumno}>Cerrar sesión</button>
        </div>
      )}

      {pantalla === 'leccion' && (
        <div>
          <p>{leccion.asignatura}</p>
          <h1>{leccion.titulo}</h1>
          <Ilustracion id={leccion.preguntas[0]?.imagen} />
          <p>{leccion.texto}</p>
          <button onClick={() => setPantalla('quiz')}>Hacer las actividades</button>
          <button className="secundario" onClick={() => setPantalla('menu')}>Volver al menú</button>
        </div>
      )}

      {pantalla === 'quiz' && (
        <div>
          <BarraProgreso completadas={actual + (acierto === null ? 0 : 1)} total={leccion.preguntas.length} />
          <Mascota estado={acierto === null ? 'normal' : acierto ? 'contenta' : 'animando'} />
          <p className="mensaje-mascota" role="status">
            {acierto === true && '¡Muy bien!'}
            {acierto === false && '¡Casi! Mira la respuesta y sigue adelante.'}
          </p>
          <p>Pregunta {actual + 1} de {leccion.preguntas.length}</p>
          <h2>{leccion.preguntas[actual].pregunta}</h2>
          <Ilustracion id={leccion.preguntas[actual].imagen} />
          <Actividad key={actual} tarea={leccion.preguntas[actual]} onResponder={responder} />
          {acierto !== null && (
            <button className="siguiente" onClick={siguiente}>
              {actual + 1 < leccion.preguntas.length ? 'Siguiente' : 'Ver resultado'}
            </button>
          )}
        </div>
      )}

      {pantalla === 'fin' && (
        <div>
          <Mascota estado={puntos * 2 >= leccion.preguntas.length ? 'contenta' : 'animando'} />
          <h1>¡Terminaste!</h1>
          <p>Has acertado {puntos} de {leccion.preguntas.length}</p>
          {leccion.id !== ID_REFUERZO && (
            <>
              <p>Resultados pendientes de enviar al docente: {pendientes}</p>
              <button onClick={repetir}>Repetir</button>
            </>
          )}
          <button className="secundario" onClick={() => setPantalla('menu')}>Volver al menú</button>
        </div>
      )}
    </div>
  )
}
