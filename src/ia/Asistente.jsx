import { useEffect, useRef, useState } from 'react'
import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { esquemaBasico, esquemaConIA, esquemaDeLeccion } from '../esquemas/esquemas'
import PanelLateral from '../herramientas/PanelLateral'
import { idiomaActual, t } from '../idiomas/i18n'
import Mascota from './Mascota'
import { buscarFragmentos, esCuenta, explicarLeccion, responderBasico } from './asistenteBasico'
import { activarIA, desactivarIA, enIdioma, estadoIA, generar, hayGPU, iaActivada, interrumpir, PERSONALIDAD, useIA } from './motorCompartido'

const TURNOS_DE_MEMORIA = 4

const INSTRUCCIONES = `${PERSONALIDAD}
Responde en 3 frases como máximo.
Usa la información de las lecciones si está disponible. Si no sabes algo, dilo y recomienda preguntar al profesor.
En los ejercicios, ayuda a pensar en lugar de dar la respuesta sin más.`

// Se reconoce en varios idiomas de la interfaz; las lecciones están en español.
const PIDE_ESQUEMA = /(\b(esquema|mapa mental|mapa conceptual|resumen|resumeme|mind ?map|outline|schema|schéma|carte mentale|mappa mentale|mindmap|diagrama)\b|схем|карт[ау] памят|思维导图|提纲|مخطط|خريطة ذهنية)/i

function construirInstrucciones(pregunta, lecciones, leccionActual, enTest) {
  const fragmentos = buscarFragmentos(pregunta, lecciones, leccionActual).map((f) => `- ${f.texto}`)
  const partes = [INSTRUCCIONES, enIdioma()]
  if (enTest) partes.push('El alumno está haciendo un test: dale solo pistas y nunca la respuesta.')
  if (leccionActual) partes.push(`El alumno está en la lección «${leccionActual.titulo}»:\n${leccionActual.texto}`)
  if (fragmentos.length > 0) partes.push(`Información útil:\n${fragmentos.join('\n')}`)
  return partes.join('\n\n')
}

const sinTildes = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '')

// El tema del esquema: lo que va detrás de «de» o «sobre». Vacío si se refiere a la lección abierta.
function temaPedido(pregunta) {
  const m = pregunta.match(/\b(?:de|del|sobre|acerca de|of|about|on|sur|du|des|di|della|über|zum|zur|despre|про|о|об)\s+(?:la |el |los |las |the |le |les |il |lo |der |die |das )?(.+?)[?.!]*$/i)
  const tema = m?.[1]?.trim() ?? ''
  return /^(esta |la )?leccion|^esto$/i.test(sinTildes(tema)) ? '' : tema
}

function leccionDelTema(tema, lecciones, leccionActual) {
  if (!tema) return leccionActual
  // Las entradas de ayuda no son lecciones: se busca el primer fragmento que venga de una.
  const mejor = buscarFragmentos(tema, lecciones, leccionActual, 10).find((f) => f.origen)
  return lecciones.find((l) => l.titulo === mejor?.origen) ?? null
}

function EsquemaEnChat({ esquema, onAbrir }) {
  return (
    <div className="esquema-chat">
      <strong>{esquema.titulo}</strong>
      <ul>{esquema.ramas.map((r, i) => <li key={i}>{r.titulo}{r.ideas.length > 0 && <span className="ayuda"> · {r.ideas[0]}</span>}</li>)}</ul>
      <button className="secundario" onClick={() => onAbrir(esquema)}>{t('abrirEsquema')}</button>
    </div>
  )
}

export default function Asistente({ abierta, oculta, onAlternar, lecciones, leccionActual, enTest, sinPestana, onAbrirEsquema }) {
  const ia = useIA()
  const [mensajes, setMensajes] = useState([{ de: 'asistente', saludo: true }])
  const [escrito, setEscrito] = useState('')
  const [respondiendo, setRespondiendo] = useState(false)
  const final = useRef(null)
  const entrada = useRef(null)

  useEffect(() => {
    final.current?.scrollIntoView({ block: 'nearest' })
  }, [mensajes])

  // Quien ya la activó la recupera al abrir el panel, se abra desde la pestaña o tocando a la mascota.
  useEffect(() => {
    if (!abierta || !hayGPU || estadoIA().fase !== 'basica' || !iaActivada()) return
    const temporizador = setTimeout(activarIA, 0)
    return () => clearTimeout(temporizador)
  }, [abierta])

  const anadirRespuesta = (mensaje) => setMensajes((actuales) => [...actuales, { de: 'asistente', ...mensaje }])
  const sustituirUltima = (mensaje) => setMensajes((actuales) => [...actuales.slice(0, -1), { de: 'asistente', ...mensaje }])

  async function responderConModelo(pregunta, historial) {
    setRespondiendo(true)
    anadirRespuesta({ texto: '…' })
    try {
      const anteriores = historial.filter((m) => !m.saludo && m.texto).slice(-TURNOS_DE_MEMORIA).map((m) => ({
        role: m.de === 'alumno' ? 'user' : 'assistant',
        content: m.texto,
      }))
      const texto = await generar([
        { role: 'system', content: construirInstrucciones(pregunta, lecciones, leccionActual, enTest) },
        ...anteriores,
        { role: 'user', content: pregunta },
      ], { onTexto: (parcial) => sustituirUltima({ texto: parcial, delModelo: true }) })
      if (!texto) sustituirUltima({ texto: responderBasico(pregunta, lecciones, leccionActual) })
    } catch {
      sustituirUltima({ texto: responderBasico(pregunta, lecciones, leccionActual) })
    }
    setRespondiendo(false)
  }

  async function responderEsquema(pregunta) {
    const tema = temaPedido(pregunta)
    const leccion = leccionDelTema(tema, lecciones, leccionActual)
    if (estadoIA().fase !== 'lista') {
      if (leccion) anadirRespuesta({ texto: t('esquemaListoChat'), esquema: esquemaDeLeccion(leccion) })
      else anadirRespuesta({ texto: t('esquemaSinLeccion') })
      return
    }
    setRespondiendo(true)
    anadirRespuesta({ texto: t('esquemaPensando') })
    try {
      const titulo = tema || leccion?.titulo
      if (!titulo) throw new Error('Sin tema')
      const nuevo = await esquemaConIA(titulo, leccion?.texto ?? buscarFragmentos(titulo, lecciones, leccionActual).map((f) => f.texto).join('\n'))
      const esquema = nuevo ? { ...nuevo, lengua: idiomaActual().voz } : leccion ? esquemaDeLeccion(leccion) : null
      sustituirUltima(esquema ? { texto: t('esquemaListoChat'), esquema } : { texto: t('esquemaIAFallo') })
    } catch {
      sustituirUltima(leccion ? { texto: t('esquemaListoChat'), esquema: esquemaBasico(leccion) } : { texto: t('esquemaIAFallo') })
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
    if (enTest && esCuenta(limpia)) anadirRespuesta({ texto: t('cuentaEnTest') })
    else if (PIDE_ESQUEMA.test(sinTildes(limpia))) {
      if (enTest) anadirRespuesta({ texto: t('esquemaEnTest') })
      else responderEsquema(limpia)
    }
    // Fuera de los tests, las cuentas se resuelven siempre con exactitud, sin depender del modelo.
    else if (ia.fase === 'lista' && !esCuenta(limpia)) responderConModelo(limpia, historial)
    else anadirRespuesta({ texto: responderBasico(limpia, lecciones, leccionActual) })
  }

  function explicar() {
    if (ia.fase === 'lista') {
      enviar(`Explícame con palabras sencillas la lección «${leccionActual.titulo}».`)
    } else if (!respondiendo) {
      setMensajes([...mensajes, { de: 'alumno', texto: t('explicarLeccion') }, { de: 'asistente', texto: explicarLeccion(leccionActual) }])
    }
  }

  function pedirEsquema() {
    if (respondiendo) return
    setMensajes([...mensajes, { de: 'alumno', texto: t('pideEsquema') }])
    responderEsquema('')
  }

  function abrirEsquema(esquema) {
    onAlternar()
    onAbrirEsquema(esquema)
  }

  const ultimo = mensajes[mensajes.length - 1]
  const preguntando = mensajes.length > 1
  const expresion = respondiendo || ia.fase === 'descargando'
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

        {ia.fase === 'basica' && (
          <div className="ia-tarjeta">
            {t('modoBasico')}
            {hayGPU ? (
              <button className="secundario" onClick={activarIA}>{t('activarIA')}</button>
            ) : (
              <> {t('sinIAAvanzada')}</>
            )}
          </div>
        )}
        {ia.fase === 'descargando' && (
          <div className="ia-tarjeta">
            <span role="status">{t('preparandoIA')}</span> {Math.round(ia.progreso * 100)} %
            <div className="ia-barra" role="progressbar" aria-label={t('progresoIA')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ia.progreso * 100)}>
              <div style={{ width: `${ia.progreso * 100}%` }} />
            </div>
          </div>
        )}
        {ia.fase === 'lista' && (
          <div className="ia-tarjeta">
            {t('iaActiva')}
            <button className="secundario" disabled={respondiendo || ia.ocupada} onClick={desactivarIA}>{t('desactivarIA')}</button>
          </div>
        )}
        {ia.aviso && <p className="ayuda" role="status">{ia.aviso}</p>}

        <div className="ia-mensajes" role="log" aria-live="polite" aria-busy={respondiendo}>
          {mensajes.map((m, i) => (
            <div key={i} className={`ia-fila ${m.de}`}>
              {m.de === 'asistente' && <Mascota estado="icono" />}
              <div className={`ia-mensaje ${m.de}`}>
                <span className="sr-only">{m.de === 'alumno' ? t('tu') : t('mascota')}: </span>
                {m.saludo ? t('saludoIA') : m.texto}
                {m.esquema && <EsquemaEnChat esquema={m.esquema} onAbrir={abrirEsquema} />}
                {m.de === 'asistente' && !m.esquema && !(respondiendo && i === mensajes.length - 1) && (
                  <BotonEscuchar texto={m.saludo ? t('saludoIA') : m.texto} lengua={m.saludo || m.delModelo ? idiomaActual().voz : 'es-ES'} />
                )}
              </div>
            </div>
          ))}
          <div ref={final} />
        </div>

        <div className="ia-sugerencias">
          {leccionActual && <button className="secundario" disabled={respondiendo} onClick={explicar}>{t('explicarLeccion')}</button>}
          {leccionActual && !enTest && <button className="secundario" disabled={respondiendo} onClick={pedirEsquema}>{t('hazEsquema')}</button>}
        </div>

        <form className="ia-enviar" onSubmit={(e) => { e.preventDefault(); enviar(escrito) }}>
          <input ref={entrada} aria-label={t('escribePregunta')} placeholder={t('escribePregunta')} value={escrito} autoComplete="off" onChange={(e) => setEscrito(e.target.value)} />
          {respondiendo ? (
            <button type="button" className="secundario" onClick={interrumpir}>{t('parar')}</button>
          ) : (
            <button type="submit" disabled={!escrito.trim()}>{t('enviar')}</button>
          )}
        </form>
      </div>
    </PanelLateral>
  )
}
