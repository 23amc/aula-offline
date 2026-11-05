import { useCallback, useEffect, useState } from 'react'
import Acceso from './Acceso'
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

export default function App() {
  const [portada, setPortada] = useState(true)
  const [cuenta, setCuenta] = useState(cuentaActual)
  const [pinDocente, setPinDocente] = useState(null)
  const [pantalla, setPantalla] = useState(cuenta ? 'menu' : 'acceso')
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [leccion, setLeccion] = useState(null)
  const [actual, setActual] = useState(0)
  const [puntos, setPuntos] = useState(0)
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
    setPantalla('acceso')
  }

  function salirAlumno() {
    cerrarSesion()
    setCuenta(null)
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

  function elegir(l) {
    setLeccion(l)
    setActual(0)
    setPuntos(0)
    setPantalla('leccion')
  }

  function responder(opcion) {
    const nuevosPuntos = opcion === leccion.preguntas[actual].correcta ? puntos + 1 : puntos
    setPuntos(nuevosPuntos)
    if (actual + 1 < leccion.preguntas.length) {
      setActual(actual + 1)
    } else {
      guardarResultado({
        alias: cuenta.alias,
        leccion: leccion.id,
        puntos: nuevosPuntos,
        total: leccion.preguntas.length,
        fecha: new Date().toISOString(),
      })
      setPantalla('fin')
      sincronizarYRefrescar()
    }
  }

  function repetir() {
    setActual(0)
    setPuntos(0)
    setPantalla('leccion')
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
    <div className="app">
      <div className="barra">
        <img className="logo-mini" src={logo} alt="EduGo" />
        <div className={online ? 'estado conectado' : 'estado sin-conexion'}>
          {online ? 'Con conexión' : 'Sin conexión: todo se guarda en tu móvil'}
        </div>
      </div>

      {pantalla === 'acceso' && <Acceso onAlumno={entrarComoAlumno} onDocente={entrarComoDocente} />}

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
          <p>{leccion.texto}</p>
          <button onClick={() => setPantalla('quiz')}>Empezar el quiz</button>
          <button className="secundario" onClick={() => setPantalla('menu')}>Volver al menú</button>
        </div>
      )}

      {pantalla === 'quiz' && (
        <div>
          <p>Pregunta {actual + 1} de {leccion.preguntas.length}</p>
          <h2>{leccion.preguntas[actual].pregunta}</h2>
          {leccion.preguntas[actual].opciones.map((texto, i) => (
            <button key={i} onClick={() => responder(i)}>{texto}</button>
          ))}
        </div>
      )}

      {pantalla === 'fin' && (
        <div>
          <h1>¡Terminaste!</h1>
          <p>Has acertado {puntos} de {leccion.preguntas.length}</p>
          <p>Resultados pendientes de enviar al docente: {pendientes}</p>
          <button onClick={repetir}>Repetir</button>
          <button className="secundario" onClick={() => setPantalla('menu')}>Volver al menú</button>
        </div>
      )}
    </div>
  )
}
