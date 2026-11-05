import { useState } from 'react'
import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { activarIA, estadoIA, hayGPU, iaActivada, useIA } from '../ia/motorCompartido'
import Mascota from '../ia/Mascota'
import { idiomaActual, t } from '../idiomas/i18n'
import { Atras, Marcador } from '../interfaz/Iconos'
import { colorRama, esquemaConIA, textoEsquema } from './esquemas'
import MapaMental from './MapaMental'

const sustituir = (lista, k, valor) => lista.map((x, y) => (y === k ? valor : x))
const sin = (lista, k) => lista.filter((_, y) => y !== k)

function Editor({ esquema, onCambiar, onTerminar }) {
  const cambiarRama = (i, cambios) => onCambiar({ ...esquema, ramas: sustituir(esquema.ramas, i, { ...esquema.ramas[i], ...cambios }) })
  const valido = esquema.titulo.trim() && esquema.ramas.some((r) => r.titulo.trim())

  return (
    <div className="esquema-editor">
      <label>{t('esquemaTitulo')}<input value={esquema.titulo} maxLength={60} onChange={(e) => onCambiar({ ...esquema, titulo: e.target.value })} /></label>
      {esquema.ramas.map((rama, i) => (
        <fieldset key={i} className="tarea rama-editor" style={{ borderInlineStartColor: colorRama(i)[0] }}>
          <legend>{t('esquemaRama', { n: i + 1 })}</legend>
          <input aria-label={t('esquemaNombreRama', { n: i + 1 })} placeholder={t('esquemaNombreRama', { n: i + 1 })} value={rama.titulo} maxLength={40} onChange={(e) => cambiarRama(i, { titulo: e.target.value })} />
          {rama.ideas.map((idea, k) => (
            <div key={k} className="opcion">
              <input aria-label={t('esquemaIdea', { n: k + 1, rama: rama.titulo || i + 1 })} placeholder={t('esquemaIdeaCorta')} value={idea} maxLength={90} onChange={(e) => cambiarRama(i, { ideas: sustituir(rama.ideas, k, e.target.value) })} />
              <button type="button" className="secundario quitar" aria-label={t('quitarIdea', { n: k + 1 })} onClick={() => cambiarRama(i, { ideas: sin(rama.ideas, k) })}>×</button>
            </div>
          ))}
          <div className="botones-fila">
            {rama.ideas.length < 4 && <button type="button" className="secundario" onClick={() => cambiarRama(i, { ideas: [...rama.ideas, ''] })}>{t('anadirIdea')}</button>}
            <button type="button" className="secundario" disabled={esquema.ramas.length <= 1} onClick={() => onCambiar({ ...esquema, ramas: sin(esquema.ramas, i) })}>{t('quitarRama')}</button>
          </div>
        </fieldset>
      ))}
      {esquema.ramas.length < 6 && (
        <button type="button" className="secundario" onClick={() => onCambiar({ ...esquema, ramas: [...esquema.ramas, { titulo: '', ideas: [''] }] })}>{t('anadirRama')}</button>
      )}
      <button type="button" disabled={!valido} onClick={onTerminar}>{t('esquemaListo')}</button>
    </div>
  )
}

const limpio = (esquema) => ({
  ...esquema,
  titulo: esquema.titulo.trim(),
  ramas: esquema.ramas
    .map((r) => ({ titulo: r.titulo.trim(), ideas: r.ideas.map((i) => i.trim()).filter(Boolean) }))
    .filter((r) => r.titulo),
})

// contexto: el tema y el texto con los que la IA puede rehacer el esquema (por ejemplo, la lección).
export default function PantallaEsquema({ inicial, contexto, onGuardar, onVolver }) {
  const ia = useIA()
  const [esquema, setEsquema] = useState(inicial)
  const [editando, setEditando] = useState(!inicial.titulo || inicial.ramas.length === 0)
  const [guardado, setGuardado] = useState(Boolean(inicial.id))
  const [elegida, setElegida] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [aviso, setAviso] = useState('')

  const puedeIA = ia.fase === 'lista' || (hayGPU && iaActivada())
  const tema = esquema.titulo.trim() || contexto?.tema || ''

  function cambiar(nuevo) {
    setEsquema(nuevo)
    setGuardado(false)
  }

  async function crearConIA() {
    setAviso('')
    setGenerando(true)
    if (await activarIA()) {
      try {
        const nuevo = await esquemaConIA(tema, contexto?.texto ?? '')
        if (nuevo) {
          cambiar({ ...esquema, titulo: esquema.titulo.trim() || nuevo.titulo, ramas: nuevo.ramas, lengua: idiomaActual().voz })
          setEditando(false)
          setAviso(t('esquemaIAHecho'))
        } else {
          setAviso(t('esquemaIAFallo'))
        }
      } catch {
        setAviso(t('esquemaIAFallo'))
      }
    } else {
      setAviso(estadoIA().aviso)
    }
    setGenerando(false)
  }

  function guardar() {
    const final = limpio(esquema)
    const conId = onGuardar(final)
    setEsquema(conId)
    setGuardado(true)
    setAviso(t('esquemaGuardado'))
  }

  function terminar() {
    setEsquema(limpio(esquema))
    setEditando(false)
  }

  function elegir(i) {
    setElegida(i)
    document.getElementById(`rama-${i}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  return (
    <>
      <div className="cabecera-lista">
        <button className="boton-redondo" aria-label={t('volver')} onClick={onVolver}><Atras /></button>
        <span className="cabecera-texto">{t('esquema')}</span>
        <button className="boton-redondo" aria-label={t('guardarEsquema')} aria-pressed={guardado} disabled={editando || generando} onClick={guardar}><Marcador activo={guardado} /></button>
      </div>
      <h1>{esquema.titulo || t('nuevoEsquema')}</h1>

      {generando && (
        <div className="mascota-fila" role="status">
          <span className="mascota-mini"><Mascota estado="pensando" /></span>
          <span>{ia.fase === 'descargando' ? `${t('preparandoIA')} ${Math.round(ia.progreso * 100)} %` : t('esquemaPensando')}</span>
        </div>
      )}

      {editando ? (
        <Editor esquema={esquema} onCambiar={cambiar} onTerminar={terminar} />
      ) : (
        <>
          <MapaMental titulo={esquema.titulo} ramas={esquema.ramas} elegida={elegida} onElegir={elegir} />
          <ol className="esquema-arbol" aria-label={t('esquemaDe', { titulo: esquema.titulo })}>
            {esquema.ramas.map((rama, i) => (
              <li key={i} id={`rama-${i}`} className={elegida === i ? 'tarjeta elegida' : 'tarjeta'} style={{ '--color-rama': colorRama(i)[0], '--fondo-rama': colorRama(i)[1] }}>
                <h2>{rama.titulo}</h2>
                {rama.ideas.length > 0 && <ul>{rama.ideas.map((idea, k) => <li key={k}>{idea}</li>)}</ul>}
              </li>
            ))}
          </ol>
          <BotonEscuchar texto={textoEsquema(esquema)} lengua={esquema.lengua} />
        </>
      )}

      {aviso && <p className="aviso" role="status">{aviso}</p>}

      {!editando && (
        <div className="botones-fila">
          <button className="secundario" disabled={generando} onClick={() => setEditando(true)}>{t('editarEsquema')}</button>
          {!guardado && <button disabled={generando} onClick={guardar}>{t('guardarEsquema')}</button>}
        </div>
      )}
      {puedeIA && tema && (
        <button className="secundario" disabled={generando || ia.ocupada} onClick={crearConIA}>
          {esquema.ramas.length ? t('rehacerConIA') : t('crearConIA')}
        </button>
      )}
      {!puedeIA && hayGPU && <p className="ayuda">{t('esquemaSinIA')}</p>}
    </>
  )
}
