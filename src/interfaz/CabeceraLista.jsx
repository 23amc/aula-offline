import { t } from '../idiomas/i18n'
import { Atras } from './Iconos'

export default function CabeceraLista({ titulo, onAtras, etiquetaAtras = t('navInicio'), children }) {
  return (
    <div className="cabecera-lista">
      <button className="boton-redondo" aria-label={etiquetaAtras} onClick={onAtras}><Atras /></button>
      <h1>{titulo}</h1>
      {children}
    </div>
  )
}
