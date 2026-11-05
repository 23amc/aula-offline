import { useCallback, useEffect, useRef, useState } from 'react'
import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import PanelLateral from '../herramientas/PanelLateral'
import { idiomaActual, t } from '../idiomas/i18n'
import Mascota from './Mascota'
import { buscarFragmentos, esCuenta, explicarLeccion, responderBasico } from './asistenteBasico'

const CLAVE_ACTIVADA = 'ia_avanzada'
const TURNOS_DE_MEMORIA = 4

const INSTRUCCIONES = `Eres la mascota de EduGo, un libro simpático que hace de tutor en una app educativa para niños y niñas.
Responde con frases cortas y sencillas, en 3 frases como máximo.
Usa la información de las lecciones si está disponible. Si no sabes algo, dilo y recomienda preguntar al profesor.
Habla solo de temas adecuados para menores. En los ejercicios, ayuda a pensar en lugar de dar la respuesta sin más.`

function construirInstrucciones(pregunta, lecciones, leccionActual, enTest) {
  const fragmentos = buscarFragmentos(pregunta, lecciones, leccionActual).map((f) => `- ${f.texto}`)
  const partes = [INSTRUCCIONES, `Responde siempre en este idioma: ${idiomaActual().nombre}.`]
  if (enTest) partes.push('El alumno está haciendo un test: dale solo pistas y nunca la respuesta.')
  if (leccionActual) partes.push(`El alumno está en la lección «${leccionActual.titulo}»:\n${leccionActual.texto}`)
  if (fragmentos.length > 0) partes.push(`Información útil:\n${fragmentos.join('\n')}`)
  return partes.join('\n\n')
}

export default function Asistente({ abierta, oculta, onAlternar, lecciones, leccionActual, enTest, sinPestana }) {
  const [mensajes, setMensajes] = useState([{ de: 'asistente', saludo: true }])
  const [escrito, setEscrito] = useState('')
  const [estadoIA, setEstadoIA] = useState('basica') // basica | descargando | lista
  const [progreso, setProgreso] = useState(0)
  const [aviso, setAviso] = useState('')
  const [respondiendo, setRespondiendo] = useState(false)
  const motor = useRef(null)
  const cargando = useRef(false)
  const final = useRef(null)
  const entrada = useRef(null)

  const hayGPU = Boolean(navigator.gpu)

  useEffect(() => {
    final.current?.scrollIntoView({ block: 'nearest' })
  }, [mensajes])

  const activar = useCallback(async () => {
    cargando.current = true
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
      setAviso(navigator.onLine ? t('errIA') : t('errIASinRed'))
      // Sin conexión puede ser algo pasajero: se reintentará la próxima vez.
      if (navigator.onLine) localStorage.removeItem(CLAVE_ACTIVADA)
    }
    cargando.current = false
  }, [])

  // Quien ya la activó la recupera al abrir el panel, se abra desde la pestaña o tocando a la mascota.
  useEffect(() => {
    if (!abierta || !hayGPU || motor.current || cargando.current || !localStorage.getItem(CLAVE_ACTIVADA)) return
    const temporizador = setTimeout(activar, 0)
    return () => clearTimeout(temporizador)
  }, [abierta, hayGPU, activar])

  async function desactivar() {
    localStorage.removeItem(CLAVE_ACTIVADA)
    setEstadoIA('basica')
    await motor.current?.unload().catch(() => {})
    motor.current = null
    const { borrarModelo } = await import('./motorIA')
    await borrarModelo().catch(() => {})
    setAviso(t('iaDesactivada'))
  }

  function anadirRespuesta(texto) {
    setMensajes((actuales) => [...actuales, { de: 'asistente', texto }])
  }

  async function responderConModelo(pregunta, historial) {
    setRespondiendo(true)
    setMensajes((actuales) => [...actuales, { de: 'asistente', texto: '…' }])
    const escribir = (texto, delModelo = true) => setMensajes((actuales) => [...actuales.slice(0, -1), { de: 'asistente', texto, delModelo }])
    try {
      const anteriores = historial.filter((m) => !m.saludo).slice(-TURNOS_DE_MEMORIA).map((m) => ({
        role: m.de === 'alumno' ? 'user' : 'assistant',
        content: m.texto,
      }))
      const flujo = await motor.current.chat.completions.create({
        messages: [
          { role: 'system', content: construirInstrucciones(pregunta, lecciones, leccionActual, enTest) },
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
      if (!texto) escribir(responderBasico(pregunta, lecciones, leccionActual), false)
    } catch {
      escribir(responderBasico(pregunta, lecciones, leccionActual), false)
    }
    setRespondiendo(false)
  }

  function enviar(pregunta) {
    // Los botones se desactivan mientras responde: el foco no debe perderse con ellos.
    entrada.current?.focus()
    const limpia = pregunta.trim()
    if (!limpia || respondiendo) return
    const historial = mensajes
    setMensajes([...mensajes, { de: 'alumno', texto: limpia }])
    setEscrito('')
    if (enTest && esCuenta(limpia)) anadirRespuesta(t('cuentaEnTest'))
    // Fuera de los tests, las cuentas se resuelven siempre con exactitud, sin depender del modelo.
    else if (estadoIA === 'lista' && !esCuenta(limpia)) responderConModelo(limpia, historial)
    else anadirRespuesta(responderBasico(limpia, lecciones, leccionActual))
  }

  function explicar() {
    if (estadoIA === 'lista') {
      enviar(`Explícame con palabras sencillas la lección «${leccionActual.titulo}».`)
    } else if (!respondiendo) {
      setMensajes([...mensajes, { de: 'alumno', texto: t('explicarLeccion') }, { de: 'asistente', texto: explicarLeccion(leccionActual) }])
    }
  }

  const ultimo = mensajes[mensajes.length - 1]
  const preguntando = mensajes.length > 1
  const expresion = respondiendo || estadoIA === 'descargando'
    ? 'pensando'
    : !preguntando ? 'normal' : ultimo.texto === t('respNoEncuentro') ? 'animando' : 'contenta'

  return (
    <PanelLateral
      nombre={t('ia')}
      oculto={oculta}
      sinPestana={sinPestana}
      icono={<Mascota estado="icono" />}
      posicion="abajo"
      abierto={abierta}
      onAlternar={onAlternar}
    >
      <div className="ia">
          <div className="ia-cabecera">
            {/* La clave repite la animación con cada respuesta. */}
            <Mascota key={mensajes.length} estado={expresion} />
            <h2>{t('preguntame')}</h2>
          </div>

          {estadoIA === 'basica' && (
            <div className="ia-tarjeta">
              {t('modoBasico')}
              {hayGPU ? (
                <button className="secundario" onClick={activar}>{t('activarIA')}</button>
              ) : (
                <> {t('sinIAAvanzada')}</>
              )}
            </div>
          )}
          {estadoIA === 'descargando' && (
            <div className="ia-tarjeta">
              <span role="status">{t('preparandoIA')}</span> {Math.round(progreso * 100)} %
              <div className="ia-barra" role="progressbar" aria-label={t('progresoIA')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progreso * 100)}>
                <div style={{ width: `${progreso * 100}%` }} />
              </div>
            </div>
          )}
          {estadoIA === 'lista' && (
            <div className="ia-tarjeta">
              {t('iaActiva')}
              <button className="secundario" disabled={respondiendo} onClick={desactivar}>{t('desactivarIA')}</button>
            </div>
          )}
          {aviso && <p className="ayuda" role="status">{aviso}</p>}

          <div className="ia-mensajes" role="log" aria-live="polite" aria-busy={respondiendo}>
            {mensajes.map((m, i) => (
              <div key={i} className={`ia-fila ${m.de}`}>
                {m.de === 'asistente' && <Mascota estado="icono" />}
                <div className={`ia-mensaje ${m.de}`}>
                  <span className="sr-only">{m.de === 'alumno' ? t('tu') : t('mascota')}: </span>
                  {m.saludo ? t('saludoIA') : m.texto}
                  {m.de === 'asistente' && !(respondiendo && i === mensajes.length - 1) && (
                    <BotonEscuchar texto={m.saludo ? t('saludoIA') : m.texto} lengua={m.saludo || m.delModelo ? idiomaActual().voz : 'es-ES'} />
                  )}
                </div>
              </div>
            ))}
            <div ref={final} />
          </div>

          {leccionActual && (
            <div className="ia-sugerencias">
              <button className="secundario" disabled={respondiendo} onClick={explicar}>{t('explicarLeccion')}</button>
            </div>
          )}

          <form className="ia-enviar" onSubmit={(e) => { e.preventDefault(); enviar(escrito) }}>
            <input ref={entrada} aria-label={t('escribePregunta')} placeholder={t('escribePregunta')} value={escrito} autoComplete="off" onChange={(e) => setEscrito(e.target.value)} />
            {respondiendo ? (
              <button type="button" className="secundario" onClick={() => motor.current?.interruptGenerate()}>{t('parar')}</button>
            ) : (
              <button type="submit" disabled={!escrito.trim()}>{t('enviar')}</button>
            )}
          </form>
      </div>
    </PanelLateral>
  )
}
