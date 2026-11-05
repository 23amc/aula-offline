import { t } from '../idiomas/i18n'

// Anillo de progreso con un icono o marca en el centro.
export function Anillo({ porcentaje, etiqueta, children, grande = false }) {
  const radio = 42
  const circunferencia = 2 * Math.PI * radio
  return (
    <div className={grande ? 'anillo anillo-grande' : 'anillo'} role="img" aria-label={etiqueta}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="anillo-fondo" cx="50" cy="50" r={radio} />
        <circle
          className="anillo-valor"
          cx="50"
          cy="50"
          r={radio}
          strokeDasharray={`${(porcentaje / 100) * circunferencia} ${circunferencia}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="anillo-centro">{children}</div>
    </div>
  )
}

export function MiniBarra({ porcentaje, tono }) {
  return (
    <span className={`mini-barra tono-${tono}`} aria-hidden="true">
      <span style={{ width: `${porcentaje}%` }} />
    </span>
  )
}

// Últimos resultados, del más antiguo al más reciente, que se resalta.
export function GraficaResultados({ resultados }) {
  const ultimos = resultados.slice(-6).map((r) => Math.round((r.puntos / r.total) * 100))
  if (ultimos.length === 0) return null
  return (
    <section className="tarjeta grafica-tarjeta">
      <div className="grafica-cabecera">
        <h2>{t('ultimosResultados')}</h2>
        <span className="ayuda">{ultimos.at(-1)}%</span>
      </div>
      <div className="grafica" role="img" aria-label={`${t('ultimosResultados')}: ${ultimos.map((p) => `${p}%`).join(', ')}`}>
        {ultimos.map((p, i) => (
          <span key={i} className="grafica-columna">
            <span className={i === ultimos.length - 1 ? 'grafica-valor reciente' : 'grafica-valor'} style={{ height: `${Math.max(p, 4)}%` }} />
          </span>
        ))}
      </div>
    </section>
  )
}
