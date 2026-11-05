import { t } from '../idiomas/i18n'

const N = '#06264d' // Azul oscuro del logo
const AGUA = '#38bdf8'
const SOL = '#ffcd19'
const VERDE = '#22a45d'
const trazo = { stroke: N, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }

function Tortuga({ x, y, s = 1, izquierda = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${izquierda ? -s : s} ${s})`} {...trazo}>
      <path d="M-24 8 l-8 5" fill="none" />
      <circle cx="-13" cy="13" r="5" fill="#86efac" />
      <circle cx="13" cy="13" r="5" fill="#86efac" />
      <circle cx="28" cy="-3" r="9" fill="#86efac" />
      <path d="M-24 9 a24 22 0 0 1 48 0 z" fill={VERDE} />
      <path d="M-10 -4 l10 -7 l10 7 l-3 11 h-14 z" fill="#4ade80" strokeWidth="2" />
      <circle cx="31" cy="-5" r="1.8" fill={N} stroke="none" />
    </g>
  )
}

function Conejo({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...trazo} fill="#e5e7eb">
      <ellipse cx="-7" cy="-30" rx="4.5" ry="14" />
      <ellipse cx="7" cy="-30" rx="4.5" ry="14" />
      <ellipse cx="0" cy="8" rx="15" ry="18" />
      <circle cx="0" cy="-12" r="13" />
      <circle cx="-5" cy="-14" r="1.8" fill={N} stroke="none" />
      <circle cx="5" cy="-14" r="1.8" fill={N} stroke="none" />
      <path d="M-3 -7 q3 3 6 0" fill="none" strokeWidth="2" />
    </g>
  )
}

function Flecha({ d, color = N }) {
  return (
    <>
      <defs>
        <marker id={`punta-${color.slice(1)}`} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
          <path d="M0 0 L12 6 L0 12 z" fill={color} />
        </marker>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" markerEnd={`url(#punta-${color.slice(1)})`} />
    </>
  )
}

function Tierra({ cx, cy, r }) {
  return (
    <g {...trazo}>
      <circle cx={cx} cy={cy} r={r} fill={AGUA} />
      <path d={`M${cx - r * 0.6} ${cy - r * 0.45} q${r * 0.4} ${-r * 0.35} ${r * 0.7} ${-r * 0.05} q${-r * 0.1} ${r * 0.5} ${-r * 0.5} ${r * 0.4} z`} fill={VERDE} strokeWidth="2" />
      <path d={`M${cx + r * 0.1} ${cy + r * 0.2} q${r * 0.5} ${-r * 0.15} ${r * 0.55} ${r * 0.2} q${-r * 0.2} ${r * 0.45} ${-r * 0.55} ${r * 0.25} z`} fill={VERDE} strokeWidth="2" />
    </g>
  )
}

function Vapor({ x, y }) {
  return (
    <g fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round">
      <path d={`M${x - 16} ${y} q-7 -9 0 -18 q7 -9 0 -18`} />
      <path d={`M${x} ${y} q-7 -9 0 -18 q7 -9 0 -18`} />
      <path d={`M${x + 16} ${y} q-7 -9 0 -18 q7 -9 0 -18`} />
    </g>
  )
}

function Cubito({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...trazo}>
      <path d="M-24 -10 l24 -13 l24 13 l-24 13 z" fill="#e0f2fe" />
      <path d="M-24 -10 v28 l24 13 v-28 z" fill="#7dd3fc" />
      <path d="M24 -10 v28 l-24 13 v-28 z" fill="#bae6fd" />
    </g>
  )
}

function Fuego({ x, y }) {
  return (
    <g {...trazo}>
      <path d={`M${x - 14} ${y} q-8 -14 4 -24 q0 8 5 8 q-2 -12 7 -18 q2 10 8 14 q6 8 -1 20 z`} fill="#fb923c" />
      <path d={`M${x - 5} ${y} q-3 -7 3 -12 q3 6 6 12 z`} fill={SOL} strokeWidth="2" />
    </g>
  )
}

const ESCENAS = {
  fabula: (
    <>
      <Tortuga x={120} y={38} s={0.9} />
      <g {...trazo}>
        <path d="M120 80 q-30 -16 -72 -6 v50 q42 -10 72 6 z" fill="white" />
        <path d="M120 80 q30 -16 72 -6 v50 q-42 -10 -72 6 z" fill="white" />
      </g>
      <g stroke={N} strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M62 88 q24 -5 44 3" fill="none" />
        <path d="M62 102 q24 -5 44 3" fill="none" />
        <path d="M134 91 q20 -8 44 -3" fill="none" />
        <path d="M134 105 q20 -8 44 -3" fill="none" />
      </g>
    </>
  ),
  'tortuga-rio': (
    <>
      <rect width="240" height="140" fill="#dcfce7" rx="10" />
      <path d="M92 0 q-14 35 0 70 q14 35 0 70 h56 q14 -35 0 -70 q-14 -35 0 -70 z" fill={AGUA} />
      <g fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
        <path d="M108 40 q6 -5 12 0 t12 0" />
        <path d="M108 95 q6 -5 12 0 t12 0" />
      </g>
      <Tortuga x={45} y={85} />
      <Tortuga x={195} y={65} s={0.75} izquierda />
      <Tortuga x={200} y={105} s={0.55} izquierda />
    </>
  ),
  'animales-dudan': (
    <>
      <rect width="240" height="140" fill="#dcfce7" rx="10" />
      <Tortuga x={60} y={105} />
      <Conejo x={185} y={100} />
      <g {...trazo}>
        <path d="M115 18 h66 q8 0 8 8 v22 q0 8 -8 8 h-32 l-14 14 v-14 h-20 q-8 0 -8 -8 v-22 q0 -8 8 -8 z" fill="white" />
      </g>
      <path d="M133 28 l20 20 M153 28 l-20 20" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  'tortuga-pasos': (
    <>
      <rect width="240" height="140" fill="#e0f2fe" rx="10" />
      <rect y="108" width="240" height="32" fill="#bbf7d0" />
      <g {...trazo}>
        <circle cx="40" cy="30" r="12" fill={SOL} />
        <circle cx="120" cy="20" r="12" fill={SOL} />
        <circle cx="200" cy="30" r="12" fill={SOL} />
      </g>
      <g fill={N}>
        {[20, 40, 60, 80, 100, 120].map((x) => <circle key={x} cx={x} cy="122" r="3" />)}
      </g>
      <Tortuga x={175} y={102} />
    </>
  ),
  'meta-alcanzada': (
    <>
      <rect width="240" height="140" fill="#dcfce7" rx="10" />
      <path d="M0 140 q120 -80 240 0 z" fill="#86efac" />
      <g {...trazo}>
        <path d="M172 92 V22" fill="none" />
        <path d="M172 22 l36 12 l-36 12 z" fill="#dc2626" />
      </g>
      <Tortuga x={118} y={78} />
      <path d="M60 28 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 z" fill={SOL} stroke={N} strokeWidth="2.5" strokeLinejoin="round" />
    </>
  ),
  'tres-estados': (
    <>
      <Cubito x={42} y={80} s={0.95} />
      <g {...trazo}>
        <path d="M100 52 l6 66 h28 l6 -66 z" fill="white" />
        <path d="M102 74 l4 44 h28 l4 -44 z" fill={AGUA} />
        <path d="M172 118 h44 l-4 -28 h-36 z" fill="#e5e7eb" />
      </g>
      <Vapor x={194} y={84} />
    </>
  ),
  hielo: (
    <>
      <rect width="240" height="140" fill="#f0f9ff" rx="10" />
      <Cubito x={85} y={90} />
      <Cubito x={155} y={90} />
      <Cubito x={120} y={50} s={0.9} />
    </>
  ),
  vapor: (
    <>
      <g {...trazo}>
        <path d="M170 92 L196 66 h12 l-20 44" fill="#cbd5e1" />
        <path d="M86 78 q0 -34 34 -34 q34 0 34 34" fill="none" strokeWidth="7" />
        <path d="M70 124 q-10 -46 50 -46 q60 0 50 46 z" fill="#cbd5e1" />
        <ellipse cx="120" cy="78" rx="24" ry="5" fill="#94a3b8" />
      </g>
      <Vapor x={214} y={60} />
    </>
  ),
  'olla-hirviendo': (
    <>
      <Vapor x={120} y={42} />
      <g {...trazo}>
        <path d="M70 52 h100 v42 q0 8 -8 8 h-84 q-8 0 -8 -8 z" fill="#94a3b8" />
        <path d="M70 62 h-14 M170 62 h14" fill="none" strokeWidth="6" />
        <path d="M70 52 h100 v12 q-16 8 -25 0 q-13 8 -25 0 q-13 8 -25 0 q-9 8 -25 0 z" fill={AGUA} strokeWidth="2.5" />
      </g>
      <Fuego x={92} y={136} />
      <Fuego x={132} y={136} />
    </>
  ),
  congelar: (
    <>
      <rect width="240" height="140" fill="#f0f9ff" rx="10" />
      <g {...trazo}>
        <rect x="32" y="16" width="22" height="88" rx="11" fill="white" />
        <circle cx="43" cy="110" r="18" fill={AGUA} />
        <rect x="38" y="78" width="10" height="26" fill={AGUA} stroke="none" />
      </g>
      <g stroke="#0284c7" strokeWidth="5" strokeLinecap="round">
        <path d="M120 22 v56 M96 36 l48 28 M96 64 l48 -28" />
        <path d="M120 22 l-9 -7 M120 22 l9 -7 M120 78 l-9 7 M120 78 l9 7" strokeWidth="3" />
      </g>
      <Cubito x={190} y={90} s={0.95} />
    </>
  ),
  'tierra-gravedad': (
    <>
      <Tierra cx={120} cy={72} r={42} />
      <Flecha d="M120 6 V24" color="#dc2626" />
      <Flecha d="M120 138 V120" color="#dc2626" />
      <Flecha d="M42 72 H70" color="#dc2626" />
      <Flecha d="M198 72 H170" color="#dc2626" />
      <Flecha d="M64 16 L88 40" color="#dc2626" />
      <Flecha d="M176 16 L152 40" color="#dc2626" />
    </>
  ),
  'pelota-cae': (
    <>
      <rect y="118" width="240" height="22" fill="#bbf7d0" rx="4" />
      <g {...trazo}>
        <path d="M60 14 h26 q10 0 16 6 l14 8 v12 l-12 -2 q-8 4 -18 2 h-26 z" fill="#fcd9b6" />
      </g>
      <circle cx="120" cy="58" r="14" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="5 5" />
      <circle cx="120" cy="102" r="14" fill="#f97316" stroke={N} strokeWidth="3" />
      <Flecha d="M158 28 V108" />
    </>
  ),
  'luna-orbita': (
    <>
      <rect width="240" height="140" fill="#0f172a" rx="10" />
      <g fill="white">
        {[[22, 22], [60, 112], [210, 24], [214, 108], [120, 12], [36, 70]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" />)}
      </g>
      <ellipse cx="120" cy="72" rx="92" ry="46" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 7" />
      <Tierra cx={120} cy={72} r={28} />
      <circle cx="206" cy="56" r="13" fill="#e5e7eb" stroke="white" strokeWidth="2" />
      <circle cx="202" cy="53" r="3" fill="#9ca3af" />
      <circle cx="210" cy="60" r="2" fill="#9ca3af" />
    </>
  ),
  'astronauta-salto': (
    <>
      <rect width="240" height="140" fill="#0f172a" rx="10" />
      <path d="M0 140 v-20 q120 -14 240 0 v20 z" fill="#cbd5e1" />
      <path d="M30 112 Q120 -14 210 112" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeDasharray="6 7" />
      <g {...trazo} stroke="#475569">
        <path d="M112 62 l-12 14 M128 62 l12 14 M114 72 l-5 18 M126 72 l5 18" fill="none" strokeWidth="7" />
        <rect x="108" y="46" width="24" height="30" rx="8" fill="white" />
        <circle cx="120" cy="36" r="14" fill="white" />
        <circle cx="120" cy="36" r="8" fill="#38bdf8" strokeWidth="2" />
      </g>
    </>
  ),
  'piedra-lanzada': (
    <>
      <rect y="118" width="240" height="22" fill="#bbf7d0" rx="4" />
      <Flecha d="M70 112 Q120 -40 170 108" />
      <g {...trazo}>
        <path d="M120 20 q9 -10 18 -2 q7 9 -3 15 q-11 5 -17 -3 z" fill="#94a3b8" transform="translate(-9 -2)" />
      </g>
    </>
  ),
}

function Manzana({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...trazo} strokeWidth="2.5">
      <path d="M0 -8 q-3 -6 0 -9" fill="none" />
      <path d="M1 -13 q7 -5 10 0 q-6 4 -10 0 z" fill={VERDE} strokeWidth="1.5" />
      <path d="M0 -7 q-14 -6 -14 7 q0 14 9 14 q5 -2 10 0 q9 0 9 -14 q0 -13 -14 -7 z" fill="#ef4444" />
    </g>
  )
}

function Lapiz({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...trazo} strokeWidth="2">
      <rect x="-6" y="-17" width="12" height="24" fill={SOL} />
      <rect x="-6" y="-17" width="12" height="5" fill="#f9a8d4" />
      <path d="M-6 7 l6 11 l6 -11 z" fill="#fde68a" />
    </g>
  )
}

const OBJETOS = { manzanas: Manzana, lapices: Lapiz }
const CASILLA = 36
const CLAVES_CUENTA = { manzanas: 'cuentaManzanas', lapices: 'cuentaLapices' }
// Grupos grandes en dos filas iguales: 6 son 3 y 3, y 10 son 5 y 5.
const porFila = (n) => (n > 5 ? Math.ceil(n / 2) : n)

// Dibuja cuentas como "manzanas:3+2": dos grupos, o en las restas un grupo con los quitados tachados.
function Cuenta({ objeto, a, signo, b }) {
  const Objeto = OBJETOS[objeto]
  const anchoGrupo = (n) => porFila(n) * CASILLA
  const filas = (n) => Math.ceil(n / porFila(n))
  const resta = signo === '-'
  const nFilas = resta ? filas(a) : Math.max(filas(a), filas(b))
  const alto = nFilas * CASILLA + 8
  const anchoSigno = resta ? 0 : 36
  const ancho = anchoGrupo(a) + anchoSigno + (resta ? 0 : anchoGrupo(b))

  const posicion = (i, n, inicioX) => ({
    x: inicioX + (i % porFila(n)) * CASILLA + CASILLA / 2,
    y: Math.floor(i / porFila(n)) * CASILLA + CASILLA / 2 + 4,
  })

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="ilustracion" role="img" aria-label={t(CLAVES_CUENTA[objeto], { a, b, op: t(resta ? 'menos' : 'mas') })}>
      {Array.from({ length: a }, (_, i) => {
        const { x, y } = posicion(i, a, 0)
        const quitado = resta && i >= a - b
        return (
          <g key={i} opacity={quitado ? 0.45 : 1}>
            <Objeto x={x} y={y} />
            {quitado && <path d={`M${x - 14} ${y - 14} l28 28 M${x + 14} ${y - 14} l-28 28`} stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />}
          </g>
        )
      })}
      {!resta && (
        <>
          <path d={`M${anchoGrupo(a) + 8} ${alto / 2} h20 M${anchoGrupo(a) + 18} ${alto / 2 - 10} v20`} stroke={N} strokeWidth="5" strokeLinecap="round" />
          {Array.from({ length: b }, (_, i) => {
            const { x, y } = posicion(i, b, anchoGrupo(a) + anchoSigno)
            return <Objeto key={i} x={x} y={y} />
          })}
        </>
      )}
    </svg>
  )
}

// "grupos:3x4": tres grupos iguales de cuatro manzanas, para multiplicar y repartir.
function Grupos({ a, b }) {
  const ancho = b * CASILLA + 16
  const alto = a * (CASILLA + 8) + 4
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="ilustracion" role="img" aria-label={t('imgGrupos', { a, b })}>
      {Array.from({ length: a }, (_, fila) => (
        <g key={fila}>
          <rect x="3" y={fila * (CASILLA + 8) + 3} width={ancho - 6} height={CASILLA + 2} rx="12" fill="#fff7d6" stroke={N} strokeWidth="2" strokeDasharray="5 4" />
          {Array.from({ length: b }, (_, i) => <Manzana key={i} x={8 + i * CASILLA + CASILLA / 2} y={fila * (CASILLA + 8) + 3 + CASILLA / 2 + 4} />)}
        </g>
      ))}
    </svg>
  )
}

// "fraccion:3/4": un círculo en cuatro partes iguales con tres coloreadas.
function Fraccion({ n, d }) {
  const cx = 120
  const cy = 70
  const r = 58
  const punto = (k) => [cx + r * Math.cos(-Math.PI / 2 + (k * 2 * Math.PI) / d), cy + r * Math.sin(-Math.PI / 2 + (k * 2 * Math.PI) / d)]
  return (
    <svg viewBox="0 0 240 140" className="ilustracion" role="img" aria-label={t('imgFraccion', { n, d })}>
      {Array.from({ length: d }, (_, k) => {
        const [x0, y0] = punto(k)
        const [x1, y1] = punto(k + 1)
        return <path key={k} d={`M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`} fill={k < n ? SOL : 'white'} stroke={N} strokeWidth="3" strokeLinejoin="round" />
      })}
      <text x="214" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill={N}>{n}</text>
      <path d="M200 72 h28" stroke={N} strokeWidth="3" strokeLinecap="round" />
      <text x="214" y="96" textAnchor="middle" fontSize="22" fontWeight="800" fill={N}>{d}</text>
    </svg>
  )
}

const poligono = (lados, r = 54, cx = 120, cy = 72) =>
  Array.from({ length: lados }, (_, k) => {
    const angulo = -Math.PI / 2 + (k * 2 * Math.PI) / lados
    return `${(cx + r * Math.cos(angulo)).toFixed(1)},${(cy + r * Math.sin(angulo)).toFixed(1)}`
  }).join(' ')

const FIGURAS = {
  triangulo: <polygon points={poligono(3, 60, 120, 80)} />,
  cuadrado: <rect x="68" y="20" width="104" height="104" rx="4" />,
  rectangulo: <rect x="40" y="35" width="160" height="76" rx="4" />,
  circulo: <circle cx="120" cy="72" r="56" />,
  pentagono: <polygon points={poligono(5)} />,
  hexagono: <polygon points={poligono(6)} />,
}

function Figura({ nombre }) {
  return (
    <svg viewBox="0 0 240 140" className="ilustracion" role="img" aria-label={t(`fig.${nombre}`)}>
      <g fill="#7dd3fc" stroke={N} strokeWidth="4" strokeLinejoin="round">{FIGURAS[nombre]}</g>
    </svg>
  )
}

export default function Ilustracion({ id }) {
  const cuenta = id?.match(/^(manzanas|lapices):(\d+)([+-])(\d+)$/)
  if (cuenta) return <Cuenta objeto={cuenta[1]} a={+cuenta[2]} signo={cuenta[3]} b={+cuenta[4]} />
  const grupos = id?.match(/^grupos:(\d+)x(\d+)$/)
  if (grupos) return <Grupos a={Math.min(+grupos[1], 6)} b={Math.min(+grupos[2], 8)} />
  const fraccion = id?.match(/^fraccion:(\d+)\/(\d+)$/)
  if (fraccion && +fraccion[2] >= 2 && +fraccion[2] <= 12) return <Fraccion n={Math.min(+fraccion[1], +fraccion[2])} d={+fraccion[2]} />
  const figura = id?.match(/^figura:(\w+)$/)
  if (figura && FIGURAS[figura[1]]) return <Figura nombre={figura[1]} />

  const escena = ESCENAS[id]
  if (!escena) return null
  return (
    <svg viewBox="0 0 240 140" className="ilustracion" role="img" aria-label={t(`img.${id}`)}>
      {escena}
    </svg>
  )
}
