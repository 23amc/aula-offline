import { useEffect, useState } from 'react'
import { callar, hablar, hayVoz } from './accesibilidad'
import { t } from '../idiomas/i18n'

// lengua: la del texto que se lee. Lecciones y tests están en español aunque la interfaz esté en otro idioma.
export default function BotonEscuchar({ texto, lengua }) {
  const [hablando, setHablando] = useState(false)

  // Al salir de la pantalla deja de leer.
  useEffect(() => () => {
    if (hablando) callar()
  }, [hablando])

  if (!hayVoz()) return null

  function alternar() {
    if (hablando) {
      callar()
      setHablando(false)
    } else {
      setHablando(true)
      hablar(texto, () => setHablando(false), lengua)
    }
  }

  return (
    <button type="button" className="secundario escuchar" aria-pressed={hablando} onClick={alternar}>
      <span aria-hidden="true">🔊 </span>{hablando ? t('parar') : t('escuchar')}
    </button>
  )
}
