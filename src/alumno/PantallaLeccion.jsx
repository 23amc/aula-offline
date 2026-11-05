import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { Bocadillo, BotonMascota } from '../ia/MascotaIA'
import { t } from '../idiomas/i18n'
import { Atras, FlechaDerecha, Marcador } from '../interfaz/Iconos'
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

export default function PantallaLeccion({ leccion, guardada, onGuardar, onPreguntar, onActividades, onVolver }) {
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
      <BotonEscuchar texto={leccion.texto} />
      <div className="pie-leccion">
        <span className="puntos-pasos" aria-hidden="true">
          {[...leccion.preguntas, null].map((_, i) => <span key={i} className={i === 0 ? 'activo' : ''} />)}
        </span>
        <button className="boton-flotante" aria-label={t('hacerActividades')} title={t('hacerActividades')} onClick={onActividades}><FlechaDerecha /></button>
      </div>
    </>
  )
}
