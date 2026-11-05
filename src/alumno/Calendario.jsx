import { useEffect, useRef, useState } from 'react'
import { apuntesDe, borrarApunte, guardarApunte } from '../datos/almacen'
import { idiomaActual, t } from '../idiomas/i18n'
import { Adelante, Atras, Cerrar } from '../interfaz/Iconos'

// Las fechas se guardan como «AAAA-MM-DD» en hora local: con toISOString el día cambiaría de noche.
const aClave = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const aFecha = (clave) => {
  const [a, m, d] = clave.split('-').map(Number)
  return new Date(a, m - 1, d)
}
const sumarDias = (clave, dias) => {
  const f = aFecha(clave)
  return aClave(new Date(f.getFullYear(), f.getMonth(), f.getDate() + dias))
}
const formato = (fecha, opciones) => new Intl.DateTimeFormat(idiomaActual().codigo, opciones).format(fecha)

// Semanas de lunes a domingo; los huecos de antes y después del mes son null.
function semanasDe(anio, mes) {
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7
  const dias = new Date(anio, mes + 1, 0).getDate()
  const celdas = [...Array(hueco).fill(null), ...Array.from({ length: dias }, (_, i) => aClave(new Date(anio, mes, i + 1)))]
  while (celdas.length % 7) celdas.push(null)
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7))
}

const DIAS_SEMANA = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i)) // El 1 de enero de 2024 fue lunes

export default function Calendario({ alias }) {
  const hoy = aClave(new Date())
  const [apuntes, setApuntes] = useState(() => apuntesDe(alias))
  const [elegido, setElegido] = useState(hoy)
  const [tipo, setTipo] = useState('examen')
  const [texto, setTexto] = useState('')
  const [anuncio, setAnuncio] = useState('')
  const tabla = useRef(null)
  const campo = useRef(null)
  const moverFoco = useRef(false)

  const fechaElegida = aFecha(elegido)
  const anio = fechaElegida.getFullYear()
  const mes = fechaElegida.getMonth()
  const delDia = (clave) => apuntes.filter((a) => a.fecha === clave)

  // Al moverse con las flechas el foco acompaña al día, aunque cambie de mes.
  useEffect(() => {
    if (!moverFoco.current) return
    moverFoco.current = false
    tabla.current.querySelector(`[data-fecha="${elegido}"]`)?.focus()
  }, [elegido])

  function cambiarMes(salto) {
    const primero = new Date(anio, mes + salto, 1)
    const esMesActual = aClave(primero).slice(0, 7) === hoy.slice(0, 7)
    setElegido(esMesActual ? hoy : aClave(primero))
  }

  function alPulsarTecla(e) {
    const sentido = idiomaActual().rtl ? -1 : 1
    const saltos = { ArrowLeft: -sentido, ArrowRight: sentido, ArrowUp: -7, ArrowDown: 7 }
    if (!saltos[e.key]) return
    e.preventDefault()
    moverFoco.current = true
    setElegido(sumarDias(elegido, saltos[e.key]))
  }

  function apuntar(e) {
    e.preventDefault()
    campo.current.focus()
    if (!texto.trim()) return
    setApuntes(guardarApunte(alias, { fecha: elegido, tipo, texto: texto.trim() }))
    setTexto('')
    setAnuncio(t('apuntado'))
  }

  function borrar(id) {
    setApuntes(borrarApunte(alias, id))
    setAnuncio(t('apunteBorrado'))
    campo.current.focus()
  }

  return (
    <section className="tarjeta calendario">
      <p className="ayuda calendario-ayuda">{t('ayudaCalendario')}</p>
      <p className="sr-only" role="status">{anuncio}</p>

      <div className="calendario-mes">
        <button className="boton-redondo" aria-label={t('mesAnterior')} onClick={() => cambiarMes(-1)}><Atras /></button>
        <h2 aria-live="polite">{formato(fechaElegida, { month: 'long', year: 'numeric' })}</h2>
        <button className="boton-redondo" aria-label={t('mesSiguiente')} onClick={() => cambiarMes(1)}><Adelante /></button>
      </div>

      <table ref={tabla} className="calendario-tabla" onKeyDown={alPulsarTecla}>
        <thead>
          <tr>
            {DIAS_SEMANA.map((d) => (
              <th key={d.getDay()} scope="col">
                <span aria-hidden="true">{formato(d, { weekday: 'narrow' })}</span>
                <span className="sr-only">{formato(d, { weekday: 'long' })}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanasDe(anio, mes).map((semana, i) => (
            <tr key={i}>
              {semana.map((clave, j) => {
                if (!clave) return <td key={j} />
                const delDiaActual = delDia(clave)
                const fecha = formato(aFecha(clave), { weekday: 'long', day: 'numeric', month: 'long' })
                return (
                  <td key={clave}>
                    <button
                      className="calendario-dia"
                      data-fecha={clave}
                      tabIndex={clave === elegido ? 0 : -1}
                      aria-pressed={clave === elegido}
                      aria-current={clave === hoy ? 'date' : undefined}
                      aria-label={delDiaActual.length ? `${fecha}. ${t('nApuntes', { n: delDiaActual.length })}` : fecha}
                      onClick={() => setElegido(clave)}
                    >
                      {aFecha(clave).getDate()}
                      <span className="calendario-puntos" aria-hidden="true">
                        {delDiaActual.slice(0, 3).map((a) => <span key={a.id} className={`punto-${a.tipo}`} />)}
                      </span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="calendario-fecha">{formato(fechaElegida, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      {delDia(elegido).length === 0 ? <p className="ayuda">{t('nadaEseDia')}</p> : (
        <ul className="calendario-lista">
          {delDia(elegido).map((a) => (
            <li key={a.id}>
              <span className={`etiqueta ${a.tipo === 'examen' ? 'tono-coral' : 'tono-azul'}`}>{t(a.tipo)}</span>
              <span className="calendario-texto">{a.texto}</span>
              <button className="boton-redondo" aria-label={t('borrarApunte', { texto: a.texto })} onClick={() => borrar(a.id)}><Cerrar /></button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={apuntar}>
        <div className="calendario-tipos" role="group" aria-label={t('tipoApunte')}>
          {['examen', 'tarea'].map((opcion) => (
            <button key={opcion} type="button" className="chip" aria-pressed={tipo === opcion} onClick={() => setTipo(opcion)}>{t(opcion)}</button>
          ))}
        </div>
        <label>
          {t('queApuntar')}
          <input ref={campo} value={texto} maxLength={80} autoComplete="off" required onChange={(e) => setTexto(e.target.value)} />
        </label>
        <button type="submit">{t('apuntar')}</button>
      </form>
    </section>
  )
}
