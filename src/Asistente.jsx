import { useEffect, useRef, useState } from 'react'
import PanelLateral from './PanelLateral'
import { buscarFragmentos, esCuenta, explicarLeccion, responderBasico } from './asistenteBasico'

const CLAVE_ACTIVADA = 'ia_avanzada'
const TURNOS_DE_MEMORIA = 4
const SALUDO = '¡Hola! Soy tu ayudante de EduGo. Pregúntame lo que no entiendas de las lecciones o de cómo usar la app.'

const INSTRUCCIONES = `Eres el tutor de EduGo, una app educativa para niños y niñas.
Responde siempre en español, con frases cortas y sencillas, en 3 frases como máximo.
Usa la información de las lecciones si está disponible. Si no sabes algo, dilo y recomienda preguntar al profesor.
Habla solo de temas adecuados para menores. En los ejercicios, ayuda a pensar en lugar de dar la respuesta sin más.`

function construirInstrucciones(pregunta, lecciones, leccionActual) {
  const fragmentos = buscarFragmentos(pregunta, lecciones, leccionActual).map((f) => `- ${f.texto}`)
  const partes = [INSTRUCCIONES]
  if (leccionActual) partes.push(`El alumno está en la lección «${leccionActual.titulo}»:\n${leccionActual.texto}`)
  if (fragmentos.length > 0) partes.push(`Información útil:\n${fragmentos.join('\n')}`)
  return partes.join('\n\n')
}

export default function Asistente({ abierta, onAlternar, lecciones, leccionActual, enTest }) {
  const [mensajes, setMensajes] = useState([{ de: 'asistente', texto: SALUDO }])
  const [escrito, setEscrito] = useState('')
  const [estadoIA, setEstadoIA] = useState('basica') // basica | descargando | lista
  const [progreso, setProgreso] = useState(0)
  const [aviso, setAviso] = useState('')
  const [respondiendo, setRespondiendo] = useState(false)
  const motor = useRef(null)
  const final = useRef(null)

  const hayGPU = Boolean(navigator.gpu)

  useEffect(() => {
    final.current?.scrollIntoView({ block: 'nearest' })
  }, [mensajes])

  async function activar() {
    setAviso('')
    setProgreso(0)
    setEstadoIA('descargando')
    try {
      const { cargarMotor } = await import('./motorIA')
      motor.current = await cargarMotor(setProgreso)
      localStorage.setItem(CLAVE_ACTIVADA, '1')
      setEstadoIA('lista')
    } catch {
      setEstadoIA('basica')
      setAviso(navigator.onLine
        ? 'Este dispositivo no ha podido usar la IA avanzada. Sigues teniendo el modo básico.'
        : 'Sin conexión no se ha podido cargar la IA avanzada. Sigues teniendo el modo básico.')
      // Sin conexión puede ser algo pasajero: se reintentará la próxima vez.
      if (navigator.onLine) localStorage.removeItem(CLAVE_ACTIVADA)
    }
  }

  async function desactivar() {
    localStorage.removeItem(CLAVE_ACTIVADA)
    setEstadoIA('basica')
    await motor.current?.unload().catch(() => {})
    motor.current = null
    const { borrarModelo } = await import('./motorIA')
    await borrarModelo().catch(() => {})
    setAviso('IA avanzada desactivada y descarga borrada.')
  }

  function alternar() {
    // Quien ya la activó la recupera al abrir el panel, sin tener que pedirla otra vez.
    if (!abierta && estadoIA === 'basica' && hayGPU && localStorage.getItem(CLAVE_ACTIVADA)) activar()
    onAlternar()
  }

  function anadirRespuesta(texto) {
    setMensajes((actuales) => [...actuales, { de: 'asistente', texto }])
  }

  async function responderConModelo(pregunta, historial) {
    setRespondiendo(true)
    setMensajes((actuales) => [...actuales, { de: 'asistente', texto: '…' }])
    const escribir = (texto) => setMensajes((actuales) => [...actuales.slice(0, -1), { de: 'asistente', texto }])
    try {
      const anteriores = historial.slice(1).slice(-TURNOS_DE_MEMORIA).map((m) => ({
        role: m.de === 'alumno' ? 'user' : 'assistant',
        content: m.texto,
      }))
      const flujo = await motor.current.chat.completions.create({
        messages: [
          { role: 'system', content: construirInstrucciones(pregunta, lecciones, leccionActual) },
          ...anteriores,
          { role: 'user', content: pregunta },
        ],
        temperature: 0.3,
        max_tokens: 200,
        stream: true,
      })
      let texto = ''
      for await (const trozo of flujo) {
        texto += trozo.choices[0]?.delta?.content ?? ''
        if (texto) escribir(texto)
      }
      if (!texto) escribir(responderBasico(pregunta, lecciones, leccionActual))
    } catch {
      escribir(responderBasico(pregunta, lecciones, leccionActual))
    }
    setRespondiendo(false)
  }

  function enviar(pregunta) {
    const limpia = pregunta.trim()
    if (!limpia || respondiendo) return
    const historial = mensajes
    setMensajes([...mensajes, { de: 'alumno', texto: limpia }])
    setEscrito('')
    // Las cuentas se resuelven siempre con exactitud, sin depender del modelo.
    if (estadoIA === 'lista' && !esCuenta(limpia)) responderConModelo(limpia, historial)
    else anadirRespuesta(responderBasico(limpia, lecciones, leccionActual))
  }

  function explicar() {
    if (estadoIA === 'lista') {
      enviar(`Explícame con palabras sencillas la lección «${leccionActual.titulo}».`)
    } else if (!respondiendo) {
      setMensajes([...mensajes, { de: 'alumno', texto: 'Explícame esta lección' }, { de: 'asistente', texto: explicarLeccion(leccionActual) }])
    }
  }

  return (
    <PanelLateral nombre="IA" posicion="abajo" abierto={abierta} onAlternar={alternar}>
      {enTest ? (
        <div className="ia">
          <h2>IA</h2>
          <p role="status">Durante un test no puedo ayudarte: tienes que hacerlo tú solo. ¡Ánimo!</p>
        </div>
      ) : (
        <div className="ia">
          <h2>IA de EduGo</h2>

          {estadoIA === 'basica' && (
            <div className="ia-tarjeta">
              Modo básico: busco la respuesta en tus lecciones, sin conexión y sin enviar nada fuera.
              {hayGPU ? (
                <button className="secundario" onClick={activar}>Activar IA avanzada (descarga unos 600 MB, usa wifi)</button>
              ) : (
                <> Este dispositivo no permite la IA avanzada.</>
              )}
            </div>
          )}
          {estadoIA === 'descargando' && (
            <div className="ia-tarjeta" role="status">
              Preparando la IA avanzada… {Math.round(progreso * 100)} %
              <div className="ia-barra"><div style={{ width: `${progreso * 100}%` }} /></div>
            </div>
          )}
          {estadoIA === 'lista' && (
            <div className="ia-tarjeta">
              IA avanzada activa: funciona en este dispositivo, sin enviar nada fuera. Puede equivocarse; si dudas, pregunta a tu profesor.
              <button className="secundario" disabled={respondiendo} onClick={desactivar}>Desactivar y borrar la descarga</button>
            </div>
          )}
          {aviso && <p className="ayuda" role="status">{aviso}</p>}

          <div className="ia-mensajes" role="log" aria-live="polite">
            {mensajes.map((m, i) => <div key={i} className={`ia-mensaje ${m.de}`}>{m.texto}</div>)}
            <div ref={final} />
          </div>

          {leccionActual && (
            <div className="ia-sugerencias">
              <button className="secundario" disabled={respondiendo} onClick={explicar}>Explícame esta lección</button>
            </div>
          )}

          <form className="ia-enviar" onSubmit={(e) => { e.preventDefault(); enviar(escrito) }}>
            <input aria-label="Escribe tu pregunta" placeholder="Escribe tu pregunta" value={escrito} autoComplete="off" onChange={(e) => setEscrito(e.target.value)} />
            {respondiendo ? (
              <button type="button" className="secundario" onClick={() => motor.current?.interruptGenerate()}>Parar</button>
            ) : (
              <button type="submit" disabled={!escrito.trim()}>Enviar</button>
            )}
          </form>
        </div>
      )}
    </PanelLateral>
  )
}
