import Mascota from './Mascota'
import { t } from '../idiomas/i18n'

// La mascota es la IA: tocarla, a ella o a su bocadillo, abre el chat.
// Con bocadillo, los dos botones hacen lo mismo: el teclado y los lectores de pantalla solo necesitan uno.
export function BotonMascota({ estado = 'normal', onPreguntar, conBocadillo = false, flotante = false }) {
  return (
    <button
      className={flotante ? 'mascota-boton mascota-flotante' : 'mascota-boton'}
      aria-label={conBocadillo ? undefined : t('preguntarMascota')}
      aria-hidden={conBocadillo || undefined}
      tabIndex={conBocadillo ? -1 : undefined}
      title={flotante ? t('tocaMascota') : undefined}
      onClick={onPreguntar}
    >
      <Mascota estado={estado} />
    </button>
  )
}

export function Bocadillo({ onPreguntar }) {
  return <button className="bocadillo" onClick={onPreguntar}>{t('bocadillo')}</button>
}
