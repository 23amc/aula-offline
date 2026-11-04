import { useState, useEffect } from 'react'
import leccion from './data/leccion.json'
import './App.css'

function guardarResultado(resultado) {
  const lista = JSON.parse(localStorage.getItem('resultados') || '[]')
  lista.push(resultado)
  localStorage.setItem('resultados', JSON.stringify(lista))
}

export default function App() {
  const [alias, setAlias] = useState(localStorage.getItem('alias') || '')
  const [escrito, setEscrito] = useState('')
  const [pantalla, setPantalla] = useState(alias ? 'leccion' : 'inicio')
  const [actual, setActual] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const conectar = () => setOnline(true)
    const desconectar = () => setOnline(false)
    window.addEventListener('online', conectar)
    window.addEventListener('offline', desconectar)
    return () => {
      window.removeEventListener('online', conectar)
      window.removeEventListener('offline', desconectar)
    }
  }, [])

  function entrar() {
    if (escrito.trim() === '') return
    localStorage.setItem('alias', escrito.trim())
    setAlias(escrito.trim())
    setPantalla('leccion')
  }

  function responder(opcion) {
    const nuevosPuntos = opcion === leccion.preguntas[actual].correcta ? puntos + 1 : puntos
    setPuntos(nuevosPuntos)
    if (actual + 1 < leccion.preguntas.length) {
      setActual(actual + 1)
    } else {
      guardarResultado({
        alias: alias,
        leccion: leccion.id,
        puntos: nuevosPuntos,
        total: leccion.preguntas.length,
        fecha: new Date().toISOString(),
        enviado: false,
      })
      setPantalla('fin')
    }
  }

  function repetir() {
    setActual(0)
    setPuntos(0)
    setPantalla('leccion')
  }

  const pendientes = JSON.parse(localStorage.getItem('resultados') || '[]').filter((r) => !r.enviado).length

  return (
    <div className="app">
      <div className={online ? 'estado conectado' : 'estado sin-conexion'}>
        {online ? 'Con conexión' : 'Sin conexión: todo se guarda en tu móvil'}
      </div>

      {pantalla === 'inicio' && (
        <div>
          <h1>Aula Offline</h1>
          <p>Elige un alias (no uses tu nombre real):</p>
          <input value={escrito} onChange={(e) => setEscrito(e.target.value)} placeholder="Ej: Estrella-42" />
          <button onClick={entrar}>Entrar</button>
        </div>
      )}

      {pantalla === 'leccion' && (
        <div>
          <h1>{leccion.titulo}</h1>
          <p>Hola, {alias}</p>
          <p>{leccion.texto}</p>
          <button onClick={() => setPantalla('quiz')}>Empezar el quiz</button>
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
        </div>
      )}
    </div>
  )
}