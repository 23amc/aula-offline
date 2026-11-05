import { useState } from 'react'
import { borrarEvento, eventosDe, guardarEvento } from '../datos/almacen'
import { idiomaActual, t } from '../idiomas/i18n'
import CabeceraLista from '../interfaz/CabeceraLista'
import { Adelante, Atras } from '../interfaz/Iconos'
import { aISO, conMayuscula, cuandoEs, deISO, diasHasta, formatoDia, hoyISO, sumarDias, TIPOS_EVENTO, tipoEvento } from './fechas'

const LUNES = new Date(2024, 0, 1)

function diasDeLaSemana() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(LUNES)
    d.setDate(d.getDate() + i)
    const lengua = idiomaActual().codigo
    return { corto: d.toLocaleDateString(lengua, { weekday: 'narrow' }), largo: d.toLocaleDateString(lengua, { weekday: 'long' }) }
  })
}

function semanasDe(anio, mes) {
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7
  const dias = new Date(anio, mes + 1, 0).getDate()
  const celdas = [...Array(hueco).fill(null), ...Array.from({ length: dias }, (_, i) => aISO(new Date(anio, mes, i + 1)))]
  while (celdas.length % 7) celdas.push(null)
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7))
}

export function Evento({ evento, onBorrar, onPlanificar, conFecha = false, onAbrir }) {
  const tipo = tipoEvento(evento.tipo)
  const contenido = (
    <>
      <span className={`etiqueta tono-${tipo.tono}`}>{t(tipo.clave)}</span>
      <span className="tarjeta-textos">
        <strong>{evento.titulo}</strong>
        <span className="ayuda">
          {conFecha && `${formatoDia(evento.fecha, { weekday: 'short', day: 'numeric', month: 'short' })} · ${cuandoEs(evento.fecha)}`}
          {conFecha && evento.hora && ' · '}
          {evento.hora}
          {!evento.propio && ` · ${t('delProfesor')}`}
        </span>
        {evento.nota && <span className="ayuda">{evento.nota}</span>}
      </span>
    </>
  )
  if (onAbrir) return <button className="tarjeta evento" onClick={onAbrir}>{contenido}</button>
  return (
    <li className="tarjeta evento">
      {contenido}
      <span className="evento-acciones">
        {onPlanificar && <button className="secundario" onClick={onPlanificar}>{t('planificarRepaso')}</button>}
        {evento.propio && onBorrar && <button className="secundario quitar" aria-label={t('borrarFecha', { titulo: evento.titulo })} onClick={onBorrar}>×</button>}
      </span>
    </li>
  )
}

// Próximas fechas para la pantalla de inicio.
export function ProximasFechas({ alias, onAbrir }) {
  const todas = eventosDe(alias).filter((e) => diasHasta(e.fecha) >= 0 && diasHasta(e.fecha) <= 30)
  // El próximo examen se ve siempre, aunque antes haya varios días de repaso.
  const examen = todas.find((e) => e.tipo === 'examen')
  const proximas = todas.slice(0, 3)
  if (examen && !proximas.includes(examen)) proximas.splice(2, 1, examen)
  if (proximas.length === 0) return null
  return (
    <section className="proximas">
      <div className="seccion-cabecera">
        <h2>{t('proximasFechas')}</h2>
        <button className="enlace" onClick={onAbrir}>{t('verCalendario')}</button>
      </div>
      <div className="lista">
        {proximas.map((e) => <Evento key={e.id} evento={e} conFecha onAbrir={onAbrir} />)}
      </div>
    </section>
  )
}

const vacio = { titulo: '', tipo: 'examen', hora: '', nota: '' }

export default function Calendario({ alias, onAtras }) {
  const hoy = hoyISO()
  const [mes, setMes] = useState(() => deISO(hoy.slice(0, 8) + '01'))
  const [elegido, setElegido] = useState(hoy)
  const [eventos, setEventos] = useState(() => eventosDe(alias))
  const [nuevo, setNuevo] = useState(vacio)
  const [aviso, setAviso] = useState('')

  const refrescar = () => setEventos(eventosDe(alias))
  const delDia = (iso) => eventos.filter((e) => e.fecha === iso)
  const nombreMes = conMayuscula(mes.toLocaleDateString(idiomaActual().codigo, { month: 'long', year: 'numeric' }))
  const proximas = eventos.filter((e) => e.fecha >= hoy).slice(0, 8)

  function moverMes(delta) {
    setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  }

  function elegir(iso) {
    setElegido(iso)
    setMes(deISO(iso.slice(0, 8) + '01'))
    setAviso('')
  }

  function anadir(e) {
    e.preventDefault()
    if (!nuevo.titulo.trim()) return
    guardarEvento(alias, { ...nuevo, titulo: nuevo.titulo.trim(), nota: nuevo.nota.trim() || undefined, hora: nuevo.hora || undefined, fecha: elegido })
    setNuevo(vacio)
    setAviso(t('fechaGuardada'))
    refrescar()
  }

  function borrar(evento) {
    borrarEvento(alias, evento.id)
    setAviso(t('fechaBorrada'))
    refrescar()
  }

  // Reparte tres repasos en los días anteriores al examen que aún no han pasado.
  function planificar(evento) {
    const dias = [3, 2, 1].map((n) => sumarDias(evento.fecha, -n)).filter((iso) => iso >= hoy)
    const titulo = t('repasarPara', { titulo: evento.titulo })
    const nuevos = dias.filter((iso) => !eventos.some((e) => e.fecha === iso && e.titulo === titulo))
    for (const iso of nuevos) guardarEvento(alias, { fecha: iso, tipo: 'repaso', titulo })
    setAviso(nuevos.length ? t('repasoPlanificado', { n: nuevos.length }) : t('repasoYaPlanificado'))
    refrescar()
  }

  const semana = diasDeLaSemana()
  const eventosElegido = delDia(elegido)

  return (
    <>
      <CabeceraLista titulo={t('navCalendario')} onAtras={onAtras} />

      <div className="tarjeta calendario">
        <div className="calendario-mes">
          <button className="boton-redondo" aria-label={t('mesAnterior')} onClick={() => moverMes(-1)}><Atras /></button>
          <h2 aria-live="polite">{nombreMes}</h2>
          <button className="boton-redondo" aria-label={t('mesSiguiente')} onClick={() => moverMes(1)}><Adelante /></button>
        </div>
        <table className="calendario-tabla">
          <thead>
            <tr>{semana.map((d) => <th key={d.largo} scope="col" abbr={d.largo}>{d.corto}</th>)}</tr>
          </thead>
          <tbody>
            {semanasDe(mes.getFullYear(), mes.getMonth()).map((fila, i) => (
              <tr key={i}>
                {fila.map((iso, j) => {
                  if (!iso) return <td key={j} />
                  const delIso = delDia(iso)
                  const clases = ['dia', iso === hoy && 'hoy', delIso.some((e) => e.tipo === 'examen') && 'con-examen'].filter(Boolean).join(' ')
                  return (
                    <td key={j}>
                      <button
                        className={clases}
                        aria-pressed={iso === elegido}
                        aria-current={iso === hoy ? 'date' : undefined}
                        aria-label={`${formatoDia(iso, { weekday: 'long', day: 'numeric', month: 'long' })}${delIso.length ? `, ${t('nFechas', { n: delIso.length })}` : ''}`}
                        onClick={() => elegir(iso)}
                      >
                        <span>{Number(iso.slice(8))}</span>
                        {delIso.length > 0 && (
                          <span className="puntos-dia" aria-hidden="true">
                            {delIso.slice(0, 3).map((e) => <span key={e.id} className={`tono-${tipoEvento(e.tipo).tono}`} />)}
                          </span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {elegido !== hoy && <button className="enlace" onClick={() => elegir(hoy)}>{t('irAHoy')}</button>}
      </div>

      <section className="dia-elegido">
        <h2>{formatoDia(elegido, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        {eventosElegido.length === 0 ? <p className="ayuda">{t('diaLibre')}</p> : (
          <ul className="lista lista-eventos">
            {eventosElegido.map((e) => (
              <Evento
                key={e.id}
                evento={e}
                onBorrar={() => borrar(e)}
                onPlanificar={e.tipo === 'examen' && diasHasta(e.fecha) >= 2 ? () => planificar(e) : undefined}
              />
            ))}
          </ul>
        )}
        {aviso && <p className="aviso" role="status">{aviso}</p>}

        <form className="tarjeta form-evento" onSubmit={anadir}>
          <h3>{t('anadirFecha')}</h3>
          <label>{t('queHay')}<input value={nuevo.titulo} maxLength={60} placeholder={t('ejemploFecha')} required onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} /></label>
          <div className="fila-campos">
            <label>{t('tipo')}
              <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
                {TIPOS_EVENTO.map((tipo) => <option key={tipo.id} value={tipo.id}>{t(tipo.clave)}</option>)}
              </select>
            </label>
            <label>{t('horaOpcional')}<input type="time" value={nuevo.hora} onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })} /></label>
          </div>
          <label>{t('notaOpcional')}<input value={nuevo.nota} maxLength={120} onChange={(e) => setNuevo({ ...nuevo, nota: e.target.value })} /></label>
          <button type="submit" disabled={!nuevo.titulo.trim()}>{t('guardarFecha')}</button>
        </form>
      </section>

      <section>
        <h2>{t('proximasFechas')}</h2>
        {proximas.length === 0 ? <p className="ayuda">{t('sinProximas')}</p> : (
          <div className="lista">
            {proximas.map((e) => <Evento key={e.id} evento={e} conFecha onAbrir={() => elegir(e.fecha)} />)}
          </div>
        )}
      </section>
    </>
  )
}
