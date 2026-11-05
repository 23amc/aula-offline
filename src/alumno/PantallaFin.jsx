import { t } from '../idiomas/i18n'
import { Anillo, GraficaResultados } from '../interfaz/Graficos'
import { Barras, Check, Estrella, FlechaDerecha, Libro } from '../interfaz/Iconos'
import Azulejo from './Azulejo'

function estrellasDe(porcentaje) {
  if (porcentaje >= 90) return 3
  if (porcentaje >= 60) return 2
  return porcentaje >= 30 ? 1 : 0
}

export default function PantallaFin({ puntos, total, resultados, pendientes, esRefuerzo, onRepetir, onVolver }) {
  const porcentaje = Math.round((puntos / total) * 100)
  const estrellas = estrellasDe(porcentaje)

  return (
    <div className="fin">
      <Anillo grande porcentaje={porcentaje} etiqueta={`${porcentaje}%`}>
        <span className="sello"><Check /></span>
      </Anillo>
      <div className="estrellas" role="img" aria-label={t('nEstrellas', { n: estrellas })}>
        {[0, 1, 2].map((i) => <span key={i} className={i < estrellas ? 'ganada' : ''}><Estrella /></span>)}
      </div>
      <h1>{t('terminaste')}</h1>
      <p>{t('acertaste', { puntos, total })}</p>
      <GraficaResultados resultados={resultados} />
      <div className="cuadricula">
        <div className="tarjeta dato">
          <Azulejo tono="azul" redondo><Libro /></Azulejo>
          <span className="tarjeta-textos"><strong>{puntos}/{total}</strong><span className="ayuda">{t('aciertos')}</span></span>
        </div>
        <div className="tarjeta dato">
          <Azulejo tono="amarillo" redondo><Barras /></Azulejo>
          <span className="tarjeta-textos"><strong>{porcentaje}%</strong><span className="ayuda">{t('nota')}</span></span>
        </div>
      </div>
      {!esRefuerzo && <p className="ayuda">{t('pendientes', { n: pendientes })}</p>}
      <button className="boton-pastilla" aria-label={t('volverMenu')} title={t('volverMenu')} onClick={onVolver}><FlechaDerecha /></button>
      {!esRefuerzo && <button className="secundario" onClick={onRepetir}>{t('repetir')}</button>}
    </div>
  )
}
