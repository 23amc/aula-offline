import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { Bocadillo, BotonMascota } from '../ia/MascotaIA'
import { t } from '../idiomas/i18n'
import { Cerrar, FlechaDerecha } from '../interfaz/Iconos'
import Actividad from './Actividad'
import { textoTarea } from './actividades'
import Ilustracion from './Ilustracion'

function BarraProgreso({ completadas, total }) {
  return (
    <div className="progreso" role="progressbar" aria-label={t('progreso')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completadas}>
      {Array.from({ length: total }, (_, i) => <span key={i} className={i < completadas ? 'hecho' : ''} />)}
    </div>
  )
}

export default function PantallaQuiz({ leccion, actual, acierto, botonSiguiente, onResponder, onSiguiente, onPreguntar, onSalir }) {
  const pregunta = leccion.preguntas[actual]
  const total = leccion.preguntas.length

  return (
    <>
      <div className="cabecera-lista">
        <button className="boton-redondo" aria-label={t('volverMenu')} onClick={onSalir}><Cerrar /></button>
        <BarraProgreso completadas={actual + (acierto === null ? 0 : 1)} total={total} />
      </div>
      <div className="tarjeta pregunta-tarjeta">
        <div className="pregunta-cabecera">
          <BotonMascota conBocadillo estado={acierto === null ? 'normal' : acierto ? 'contenta' : 'animando'} onPreguntar={onPreguntar} />
          <div>
            <h1 className="pregunta" lang="es">{pregunta.pregunta}</h1>
            <p className="ayuda">{t('preguntaDe', { n: actual + 1, total })}</p>
          </div>
        </div>
        <Bocadillo onPreguntar={onPreguntar} />
        <Ilustracion id={pregunta.imagen} />
        <BotonEscuchar key={actual} texto={textoTarea(pregunta)} />
      </div>
      <div className="actividad" lang="es">
        <Actividad key={actual} tarea={pregunta} onResponder={onResponder} />
      </div>
      <p className="mensaje-mascota" role="status">
        {acierto === true && t('muyBien')}
        {acierto === false && t('casi')}
      </p>
      <button
        ref={botonSiguiente}
        className="boton-pastilla"
        disabled={acierto === null}
        aria-label={actual + 1 < total ? t('siguiente') : t('verResultado')}
        onClick={onSiguiente}
      >
        <FlechaDerecha />
      </button>
    </>
  )
}
