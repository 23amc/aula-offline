import { useState } from 'react'
import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { Bocadillo, BotonMascota } from '../ia/MascotaIA'
import { t } from '../idiomas/i18n'
import { Atras, Check, Esquema, FlechaDerecha, Marcador } from '../interfaz/Iconos'
import Ilustracion from './Ilustracion'

function Escena() {
  return (
    <svg className="escena" viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="escena-cielo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b4f8f" />
          <stop offset="1" stopColor="#0a9be4" />
        </linearGradient>
      </defs>
      <rect width="320" height="170" fill="url(#escena-cielo)" />
      <circle cx="222" cy="66" r="40" fill="#ffcc00" opacity="0.25" />
      <circle cx="222" cy="66" r="32" fill="#ffcc00" />
      <path d="M0 122 C70 92 120 100 190 122 S290 136 320 112 V170 H0z" fill="#0aa5ec" />
      <path d="M0 138 C60 118 130 124 190 144 S290 156 320 136 V170 H0z" fill="#8fd8f8" />
    </svg>
  )
}

// Un ejemplo resuelto que se descubre paso a paso, para pensar cada paso antes de verlo.
function Ejemplo({ ejemplo, numero }) {
  const [vistos, setVistos] = useState(1)
  const completo = vistos > ejemplo.pasos.length
  return (
    <li className="tarjeta ejemplo">
      <h3><span className="ejemplo-numero" aria-hidden="true">{numero}</span>{ejemplo.titulo}</h3>
      <ol aria-live="polite">
        {ejemplo.pasos.slice(0, vistos).map((paso, i) => <li key={i}>{paso}</li>)}
      </ol>
      {completo ? (
        <p className="ejemplo-resultado"><Check /> {ejemplo.resultado}</p>
      ) : (
        <button className="secundario" onClick={() => setVistos(vistos + 1)}>
          {vistos === ejemplo.pasos.length ? t('verResultadoEjemplo') : t('siguientePaso')}
        </button>
      )}
    </li>
  )
}

export default function PantallaLeccion({ leccion, guardada, onGuardar, onPreguntar, onActividades, onEsquema, onVolver }) {
  return (
    <>
      <div className="cabecera-lista">
        <button className="boton-redondo" aria-label={t('volverMenu')} onClick={onVolver}><Atras /></button>
        <span className="cabecera-texto" lang="es">{leccion.asignatura}</span>
        <button className="boton-redondo" aria-label={t('guardarLeccion')} aria-pressed={guardada} onClick={onGuardar}><Marcador activo={guardada} /></button>
      </div>
      <Escena />
      <h1 lang="es">{leccion.titulo}</h1>
      <div className="etiquetas">
        <span className="etiqueta tono-azul" lang="es">{leccion.asignatura}</span>
        <span className="etiqueta tono-amarillo">{t('nPreguntas', { n: leccion.preguntas.length })}</span>
      </div>
      <div className="mascota-fila">
        <BotonMascota conBocadillo onPreguntar={onPreguntar} />
        <Bocadillo onPreguntar={onPreguntar} />
      </div>
      <p className="texto-leccion" lang="es">{leccion.texto}</p>
      <Ilustracion id={leccion.preguntas[0]?.imagen} />
      <div className="botones-fila">
        <BotonEscuchar texto={leccion.texto} />
        <button className="secundario escuchar" onClick={onEsquema}><Esquema /> {t('verEsquema')}</button>
      </div>
      {leccion.ejemplos?.length > 0 && (
        <section className="ejemplos" lang="es">
          <h2>{t('ejemplosResueltos')}</h2>
          <ol className="lista">
            {leccion.ejemplos.map((ejemplo, i) => <Ejemplo key={`${leccion.id}-${i}`} ejemplo={ejemplo} numero={i + 1} />)}
          </ol>
        </section>
      )}
      <div className="pie-leccion">
        <span className="puntos-pasos" aria-hidden="true">
          {[...leccion.preguntas, null].map((_, i) => <span key={i} className={i === 0 ? 'activo' : ''} />)}
        </span>
        <button className="boton-flotante" aria-label={t('hacerActividades')} title={t('hacerActividades')} onClick={onActividades}><FlechaDerecha /></button>
      </div>
    </>
  )
}
