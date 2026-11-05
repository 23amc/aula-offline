import { useEffect, useRef } from 'react'
import { t } from '../idiomas/i18n'

// Desplegable del borde derecho. Se oculta sin desmontarse para conservar su contenido.
export default function PanelLateral({ nombre, icono, posicion, abierto, oculto, sinPestana = false, onAlternar, children }) {
  const pestana = useRef(null)
  const contenido = useRef(null)
  const yaAbierto = useRef(false)

  // Al abrir, el foco entra en el panel; al cerrar, vuelve a la pestaña para no perder el sitio.
  useEffect(() => {
    if (abierto) contenido.current.focus()
    else if (yaAbierto.current) (sinPestana ? document.querySelector('.mascota-flotante') : pestana.current)?.focus()
    yaAbierto.current = abierto
  }, [abierto, sinPestana])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e) => {
      if (e.key === 'Escape') onAlternar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [abierto, onAlternar])

  const clases = ['panel-lateral', abierto && 'abierto', oculto && 'oculto', sinPestana && 'sin-pestana'].filter(Boolean).join(' ')

  return (
    <aside className={clases} aria-label={nombre}>
      <button
        ref={pestana}
        className={`panel-pestana panel-pestana-${posicion}`}
        aria-expanded={abierto}
        aria-label={abierto ? t('cerrarPanel', { nombre }) : nombre}
        onClick={onAlternar}
      >
        {!abierto && icono}
        <span>{abierto ? t('cerrar') : nombre}</span>
      </button>
      <div ref={contenido} className="panel-contenido" tabIndex={-1} inert={!abierto}>{children}</div>
    </aside>
  )
}
