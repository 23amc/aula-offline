const AZUL_OSCURO = '#06264d'

// El libro del logo de EduGo y la cara de la IA. estado: 'normal', 'contenta', 'animando' o 'pensando'.
export default function Mascota({ estado }) {
  const contenta = estado === 'contenta'
  const animando = estado === 'animando'
  const pensando = estado === 'pensando'

  return (
    <svg className={`mascota mascota-${estado}`} viewBox="0 0 120 112" aria-hidden="true">
      <circle cx="60" cy="50" r="44" fill="#ffcd19" />
      <g className="mascota-rayos" stroke={AZUL_OSCURO} strokeWidth="4.5" strokeLinecap="round">
        <line x1="60" y1="12" x2="60" y2="26" />
        <line x1="40" y1="17" x2="47" y2="27" />
        <line x1="80" y1="17" x2="73" y2="27" />
      </g>
      <path d="M12 56 q10-6 18-6 v42 q18-2 30 10 q12-12 30-10 v-42 q8 0 18 6 v44 q-30-8-48 8 q-18-16-48-8 z" fill="#0aaef5" stroke={AZUL_OSCURO} strokeWidth="4" strokeLinejoin="round" />
      <path d="M28 40 q20-8 32 8 q12-16 32-8 v50 q-20-4-32 8 q-12-12-32-8 z" fill="#fff" stroke={AZUL_OSCURO} strokeWidth="4" strokeLinejoin="round" />
      <g fill="none" stroke={AZUL_OSCURO} strokeWidth="4" strokeLinecap="round">
        {pensando ? (
          <>
            <circle cx="46" cy="58" r="2.5" fill={AZUL_OSCURO} stroke="none" />
            <circle cx="74" cy="58" r="2.5" fill={AZUL_OSCURO} stroke="none" />
            <path d="M54 76 h12" />
          </>
        ) : animando ? (
          <>
            <circle cx="46" cy="60" r="2.5" fill={AZUL_OSCURO} stroke="none" />
            <circle cx="74" cy="60" r="2.5" fill={AZUL_OSCURO} stroke="none" />
            <path d="M54 76 q6 3 12 0" />
          </>
        ) : (
          <>
            <path d="M40 62 q6-9 12 0" />
            <path d="M68 62 q6-9 12 0" />
            <path d={contenta ? 'M50 71 q10 14 20 0' : 'M52 73 q8 7 16 0'} />
          </>
        )}
      </g>
      <ellipse cx="38" cy="71" rx="5" ry="3.5" fill="#ff8a6b" />
      <ellipse cx="82" cy="71" rx="5" ry="3.5" fill="#ff8a6b" />
      {pensando && (
        <g className="mascota-puntos" fill={AZUL_OSCURO}>
          <circle cx="92" cy="14" r="3.5" />
          <circle cx="103" cy="14" r="3.5" />
          <circle cx="114" cy="14" r="3.5" />
        </g>
      )}
    </svg>
  )
}
