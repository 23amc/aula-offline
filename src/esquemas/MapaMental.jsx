import { colorRama } from './esquemas'

// Reparte un texto en líneas cortas, porque SVG no ajusta el texto solo.
function partir(texto, maximo, lineas) {
  const resultado = []
  let actual = ''
  for (const palabra of texto.split(/\s+/)) {
    if (!actual) actual = palabra
    else if ((actual + ' ' + palabra).length <= maximo) actual += ' ' + palabra
    else {
      resultado.push(actual)
      actual = palabra
    }
  }
  if (actual) resultado.push(actual)
  if (resultado.length > lineas) {
    resultado.length = lineas
    resultado[lineas - 1] = resultado[lineas - 1].slice(0, maximo - 1) + '…'
  }
  return resultado.map((l) => (l.length > maximo ? l.slice(0, maximo - 1) + '…' : l))
}

function Texto({ lineas, x, y, alto, color, negrita }) {
  const primera = y - ((lineas.length - 1) * alto) / 2
  return (
    <text x={x} textAnchor="middle" dominantBaseline="central" fill={color} fontWeight={negrita ? 800 : 700} fontSize="13">
      {lineas.map((l, i) => <tspan key={i} x={x} y={primera + i * alto}>{l}</tspan>)}
    </text>
  )
}

// Mapa mental: el tema en el centro y una rama por idea principal. Es un dibujo; el contenido accesible es la lista.
export default function MapaMental({ titulo, ramas, elegida, onElegir }) {
  const n = ramas.length
  const ancho = 360
  const alto = n > 4 ? 380 : 320
  const cx = ancho / 2
  const cy = alto / 2
  const anchoNodo = 108
  const inicio = n === 2 ? Math.PI : -Math.PI / 2

  const nodos = ramas.map((rama, i) => {
    const angulo = inicio + (i * 2 * Math.PI) / Math.max(n, 1)
    const lineas = partir(rama.titulo, 13, 3)
    const altoNodo = lineas.length * 15 + 18
    const x = Math.min(Math.max(cx + 120 * Math.cos(angulo), anchoNodo / 2 + 4), ancho - anchoNodo / 2 - 4)
    const y = Math.min(Math.max(cy + (alto / 2 - 52) * Math.sin(angulo), altoNodo / 2 + 4), alto - altoNodo / 2 - 4)
    return { x, y, lineas, altoNodo }
  })
  const lineasCentro = partir(titulo || '…', 14, 3)
  const altoCentro = lineasCentro.length * 16 + 22

  return (
    <svg className="mapa-mental" viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
      {nodos.map(({ x, y }, i) => (
        <path key={i} d={`M${cx} ${cy} Q${(cx + x) / 2} ${cy} ${x} ${y}`} fill="none" stroke={colorRama(i)[0]} strokeWidth={elegida === i ? 5 : 3} strokeLinecap="round" />
      ))}
      <rect x={cx - 66} y={cy - altoCentro / 2} width="132" height={altoCentro} rx="18" fill="#0771b8" />
      <Texto lineas={lineasCentro} x={cx} y={cy} alto={16} color="white" negrita />
      {nodos.map(({ x, y, lineas, altoNodo }, i) => {
        const [color, fondo] = colorRama(i)
        return (
          <g key={i} className="mapa-nodo" onClick={() => onElegir?.(i)}>
            <rect x={x - anchoNodo / 2} y={y - altoNodo / 2} width={anchoNodo} height={altoNodo} rx="14" fill={fondo} stroke={color} strokeWidth={elegida === i ? 4 : 2.5} />
            <Texto lineas={lineas} x={x} y={y} alto={15} color="#1e3a5c" />
            {ramas[i].ideas.length > 0 && (
              <>
                <circle cx={x + anchoNodo / 2 - 4} cy={y - altoNodo / 2 + 4} r="10" fill={color} />
                <text x={x + anchoNodo / 2 - 4} y={y - altoNodo / 2 + 4} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="800">{ramas[i].ideas.length}</text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
