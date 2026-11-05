import { useState } from 'react'
import AjustesAccesibilidad from '../accesibilidad/AjustesAccesibilidad'
import { BotonMascota } from '../ia/MascotaIA'
import { estiloDe } from './asignaturas'
import Azulejo from './Azulejo'
import Calendario from './Calendario'
import { PREGUNTAS_POR_TEST } from '../datos/almacen'
import { idiomaActual, t } from '../idiomas/i18n'
import { Anillo, GraficaResultados, MiniBarra } from '../interfaz/Graficos'
import { Adelante, Atras, Barras, CalendarioIcono, Casa, Cuadricula, FlechaDerecha, Libro, Lista, Persona } from '../interfaz/Iconos'
import logo from '../assets/logo.png'

const SECCIONES = [
  { id: 'lecciones', clave: 'secLecciones' },
  { id: 'tests', clave: 'secTests' },
  { id: 'refuerzo', clave: 'secRefuerzo', clase: 'naranja' },
  { id: 'guardadas', clave: 'secGuardadas' },
]

const VISTAS = [
  { id: 'inicio', clave: 'navInicio', Icono: Casa },
  { id: 'aprender', clave: 'navAprender', Icono: Libro },
  { id: 'calendario', clave: 'navCalendario', Icono: CalendarioIcono },
  { id: 'progreso', clave: 'navProgreso', Icono: Barras },
  { id: 'perfil', clave: 'navPerfil', Icono: Persona },
]

// Mejor nota del alumno en cada lección o test, en porcentaje.
function mejoresNotas(resultados) {
  const notas = {}
  for (const r of resultados) notas[r.leccion] = Math.max(notas[r.leccion] ?? 0, Math.round((r.puntos / r.total) * 100))
  return notas
}

function CabeceraLista({ titulo, onAtras, children }) {
  return (
    <div className="cabecera-lista">
      <button className="boton-redondo" aria-label={t('navInicio')} onClick={onAtras}><Atras /></button>
      <h1>{titulo}</h1>
      {children}
    </div>
  )
}

function TarjetaLeccion({ item, subtitulo, nota, onAbrir }) {
  return (
    <button className="tarjeta tarjeta-lista" onClick={onAbrir}>
      <Azulejo asignatura={item.asignatura} />
      <span className="tarjeta-textos">
        <strong lang="es">{item.titulo}</strong>
        <span className="ayuda">{subtitulo}{nota !== undefined && ` · ${nota}%`}</span>
        <MiniBarra porcentaje={nota ?? 0} tono={estiloDe(item.asignatura).tono} />
      </span>
      <span className="chevron"><Adelante /></span>
    </button>
  )
}

function VistaInicio({ cuenta, lecciones, notas, onLeer, onVista }) {
  const hechas = lecciones.filter((l) => notas[l.id] !== undefined).length
  const porcentaje = lecciones.length ? Math.round((hechas / lecciones.length) * 100) : 0
  // Se sigue por la primera sin hacer; si están todas, por la de peor nota.
  const siguiente = lecciones.find((l) => notas[l.id] === undefined)
    ?? [...lecciones].sort((a, b) => notas[a.id] - notas[b.id])[0]

  return (
    <>
      <div className="marca">
        <img src={logo} alt="" />
        <span>EduGo</span>
        <button className="boton-redondo tono-azul" aria-label={t('navPerfil')} onClick={() => onVista('perfil')}><Persona /></button>
      </div>
      <h1>{t('hola', { alias: cuenta.alias })}</h1>
      <p className="subtitulo">{t('resumenLecciones', { hechas, total: lecciones.length })}</p>

      {siguiente && (
        <section className="destacada">
          <div className="destacada-textos">
            <h2>{t('sigueAprendiendo')}</h2>
            <p lang="es">{siguiente.titulo}</p>
            <button className="boton-amarillo" aria-label={t('continuarCon', { titulo: siguiente.titulo })} onClick={() => onLeer(siguiente)}><FlechaDerecha /></button>
          </div>
          <Anillo porcentaje={porcentaje} etiqueta={`${porcentaje}%`}><Libro /></Anillo>
        </section>
      )}

      <div className="seccion-cabecera">
        <h2>{t('tusLecciones')}</h2>
        <button className="enlace" onClick={() => onVista('aprender')}>{t('verTodo')}</button>
      </div>
      <div className="cuadricula">
        {lecciones.slice(0, 4).map((l) => (
          <button key={l.id} className="tarjeta tarjeta-cuadro" onClick={() => onLeer(l)}>
            <span className="cuadro-arriba">
              <Azulejo asignatura={l.asignatura} redondo />
              <MiniBarra porcentaje={notas[l.id] ?? 0} tono={estiloDe(l.asignatura).tono} />
            </span>
            <strong lang="es">{l.titulo}</strong>
            <span className="ayuda" lang="es">{l.asignatura}</span>
            {notas[l.id] !== undefined && <span className="sr-only">{notas[l.id]}%</span>}
          </button>
        ))}
      </div>
    </>
  )
}

function VistaAprender({ seccion, lecciones, tests, refuerzo, guardadas, notas, onSeccion, onLeer, onTest, onRefuerzo, onVista }) {
  const [enCuadricula, setEnCuadricula] = useState(false)
  const listaGuardadas = lecciones.filter((l) => guardadas.includes(l.id))

  return (
    <>
      <CabeceraLista titulo={t('navAprender')} onAtras={() => onVista('inicio')}>
        <button className="boton-redondo" aria-label={t('verCuadricula')} aria-pressed={enCuadricula} onClick={() => setEnCuadricula(!enCuadricula)}>
          {enCuadricula ? <Lista /> : <Cuadricula />}
        </button>
      </CabeceraLista>

      <div className="chips secciones">
        {SECCIONES.map((s) => (
          <button key={s.id} className={['chip', s.clase].filter(Boolean).join(' ')} aria-pressed={seccion === s.id} onClick={() => onSeccion(s.id)}>{t(s.clave)}</button>
        ))}
      </div>

      {idiomaActual().codigo !== 'es' && <p className="ayuda">{t('contenidoEspanol')}</p>}

      <div className={enCuadricula ? 'lista en-cuadricula' : 'lista'}>
        {seccion === 'lecciones' && (
          <>
            <p className="ayuda">{t('introLecciones')}</p>
            {lecciones.map((l) => <TarjetaLeccion key={l.id} item={l} subtitulo={<span lang="es">{l.asignatura}</span>} nota={notas[l.id]} onAbrir={() => onLeer(l)} />)}
          </>
        )}

        {seccion === 'tests' && (
          <>
            <p className="ayuda">{t('introTests')}</p>
            {tests.map((test) => (
              <TarjetaLeccion key={test.id} item={test} subtitulo={t('nPreguntas', { n: Math.min(test.preguntas.length, PREGUNTAS_POR_TEST) })} nota={notas[test.id]} onAbrir={() => onTest(test)} />
            ))}
          </>
        )}

        {seccion === 'guardadas' && (listaGuardadas.length === 0 ? <p>{t('nadaGuardado')}</p> : listaGuardadas.map((l) => (
          <TarjetaLeccion key={l.id} item={l} subtitulo={<span lang="es">{l.asignatura}</span>} nota={notas[l.id]} onAbrir={() => onLeer(l)} />
        )))}

        {seccion === 'refuerzo' && (refuerzo.length === 0 ? (
          <p>{t('nadaReforzar')}</p>
        ) : (
          <>
            <p className="ayuda">{t('introRefuerzo')}</p>
            <ul className="lista-refuerzo">
              {refuerzo.map((tarea) => (
                <li key={tarea.clave} className="tarjeta">
                  <span lang="es">{tarea.pregunta}</span>
                  <small><span lang="es">{tarea.asignatura}</span> · {tarea.saldo === 1 ? t('falladaUna') : t('falladaVarias', { n: tarea.saldo })}</small>
                </li>
              ))}
            </ul>
            <button className="naranja" onClick={onRefuerzo}>{t('empezarRefuerzo')}</button>
          </>
        ))}
      </div>
    </>
  )
}

function VistaProgreso({ lecciones, tests, resultados, notas, onLeer, onTest, onVista }) {
  const hechos = [...lecciones, ...tests].filter((item) => notas[item.id] !== undefined)
  return (
    <>
      <CabeceraLista titulo={t('navProgreso')} onAtras={() => onVista('inicio')} />
      {hechos.length === 0 ? <p>{t('sinResultados')}</p> : (
        <>
          <GraficaResultados resultados={resultados} />
          <div className="lista">
            {hechos.map((item) => (
              <TarjetaLeccion
                key={item.id}
                item={item}
                subtitulo={<span lang="es">{item.asignatura}</span>}
                nota={notas[item.id]}
                onAbrir={() => (tests.includes(item) ? onTest(item) : onLeer(item))}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}

function VistaCalendario({ cuenta, onVista }) {
  return (
    <>
      <CabeceraLista titulo={t('miCalendario')} onAtras={() => onVista('inicio')} />
      <Calendario key={cuenta.alias} alias={cuenta.alias} />
    </>
  )
}

function VistaPerfil({ cuenta, online, ajustes, onCambiarAjustes, onCambiarIdioma, onSalir, onVista }) {
  return (
    <>
      <CabeceraLista titulo={t('navPerfil')} onAtras={() => onVista('inicio')} />
      <div className="tarjeta perfil-tarjeta">
        <Azulejo tono="azul" redondo><Persona /></Azulejo>
        <span className="tarjeta-textos">
          <strong>{cuenta.alias}</strong>
          <span className="ayuda">{online ? t('conectado') : t('sinConexion')}</span>
        </span>
      </div>
      <div className="tarjeta perfil-ajustes">
        <AjustesAccesibilidad ajustes={ajustes} abierto onCambiar={onCambiarAjustes} onCambiarIdioma={onCambiarIdioma} />
      </div>
      <button className="secundario" onClick={onSalir}>{t('cerrarSesion')}</button>
    </>
  )
}

export function Navegacion({ vista, onVista, tapada }) {
  return (
    <nav className="navegacion" aria-label={t('navegacion')} inert={tapada}>
      {VISTAS.map(({ id, clave, Icono }) => (
        <button key={id} aria-current={vista === id ? 'page' : undefined} onClick={() => onVista(id)}>
          <Icono />
          <span>{t(clave)}</span>
        </button>
      ))}
    </nav>
  )
}

export default function MenuAlumno(props) {
  const { vista, cuenta, lecciones, tests, resultados, online, ajustes, onCambiarAjustes, onCambiarIdioma, onSalir, onLeer, onTest, onVista, onPreguntar } = props
  const notas = mejoresNotas(resultados)

  return (
    <>
      {vista === 'inicio' && <VistaInicio cuenta={cuenta} lecciones={lecciones} notas={notas} onLeer={onLeer} onVista={onVista} />}
      {vista === 'aprender' && <VistaAprender {...props} notas={notas} />}
      {vista === 'calendario' && <VistaCalendario cuenta={cuenta} onVista={onVista} />}
      {vista === 'progreso' && <VistaProgreso lecciones={lecciones} tests={tests} resultados={resultados} notas={notas} onLeer={onLeer} onTest={onTest} onVista={onVista} />}
      {vista === 'perfil' && <VistaPerfil cuenta={cuenta} online={online} ajustes={ajustes} onCambiarAjustes={onCambiarAjustes} onCambiarIdioma={onCambiarIdioma} onSalir={onSalir} onVista={onVista} />}
      <BotonMascota flotante onPreguntar={onPreguntar} />
    </>
  )
}
