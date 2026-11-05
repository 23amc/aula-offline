import { useCallback, useEffect, useState } from 'react'
import Acceso from './Acceso'
import Actividad from './Actividad'
import Ilustracion from './Ilustracion'
import Mascota from './Mascota'
import Pizarra from './Pizarra'
import PanelDocente from './PanelDocente'
import {
  cambiarAlias,
  cerrarSesion,
  contarPendientes,
  cuentaActual,
  guardarResultado,
  leerLecciones,
  sincronizar,
} from './datos'
import logo from './assets/logo.png'
import './App.css'

const DURACION_PORTADA = 1500

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
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [leccion, setLeccion] = useState(null)
  const [actual, setActual] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [acierto, setAcierto] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [nuevoAlias, setNuevoAlias] = useState('')
  const [errorAlias, setErrorAlias] = useState('')

  const refrescar = useCallback(() => {
    setLecciones(leerLecciones())
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
    setPasoAcceso('inicio')
    setPantalla('acceso')
  }

  function salirAlumno() {
    cerrarSesion()
    setCuenta(null)
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

  function empezar() {
    setActual(0)
    setPuntos(0)
    setAcierto(null)
    setPantalla('leccion')
  }

  function elegir(l) {
    setLeccion(l)
    empezar()
  }

  function responder(correcta) {
    setAcierto(correcta)
    if (correcta) setPuntos(puntos + 1)
  }

  function siguiente() {
    setAcierto(null)
    if (actual + 1 < leccion.preguntas.length) {
      setActual(actual + 1)
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
      {pantalla !== 'acceso' && <Pizarra />}

      {pantalla === 'acceso' && (
        <Acceso paso={pasoAcceso} onCambiarPaso={setPasoAcceso} onAlumno={entrarComoAlumno} onDocente={entrarComoDocente} />
      )}

      {pantalla === 'docente' && (
        <PanelDocente
          pin={pinDocente}
          online={online}
          onSalir={salirDocente}
          onLeccionesCambiadas={() => setLecciones(leerLecciones())}
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
          <p>¿Qué quieres aprender hoy?</p>
          {lecciones.map((l) => (
            <button key={l.id} onClick={() => elegir(l)}>
              {l.asignatura}: {l.titulo}
            </button>
          ))}
          <button className="secundario" onClick={salirAlumno}>Cerrar sesión</button>
        </div>
      )}

      {pantalla === 'leccion' && (
        <div>
          <p>{leccion.asignatura}</p>
          <h1>{leccion.titulo}</h1>
          <Ilustracion id={leccion.preguntas[0]?.imagen} />
          <p>{leccion.texto}</p>
          <button onClick={() => setPantalla('quiz')}>Empezar el quiz</button>
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
          <p>Resultados pendientes de enviar al docente: {pendientes}</p>
          <button onClick={empezar}>Repetir</button>
          <button className="secundario" onClick={() => setPantalla('menu')}>Volver al menú</button>
        </div>
      )}
    </div>
  )
}
