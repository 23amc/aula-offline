import { useCallback, useEffect, useRef, useState } from 'react'
import AjustesAccesibilidad from '../accesibilidad/AjustesAccesibilidad'
import BotonEscuchar from '../accesibilidad/BotonEscuchar'
import { callar, enfocarTitulo, guardarAjustes, hablar, leerAjustes } from '../accesibilidad/accesibilidad'
import Acceso from '../acceso/Acceso'
import { claveTarea, textoTarea } from '../alumno/actividades'
import { cambiarIdioma, idiomaActual, t } from '../idiomas/i18n'
import Actividad from '../alumno/Actividad'
import Asistente from '../ia/Asistente'
import Ilustracion from '../alumno/Ilustracion'
import Mascota from '../ia/Mascota'
import MenuAlumno from '../alumno/MenuAlumno'
import Pizarra from '../herramientas/Pizarra'
import PanelDocente from '../docente/PanelDocente'
import {
  cambiarAlias,
  cerrarSesion,
  contarPendientes,
  elegirPreguntasTest,
  cuentaActual,
  guardarResultado,
  leerLecciones,
  leerTests,
  registrarRespuesta,
  sincronizar,
  tareasParaReforzar,
} from '../datos/almacen'
import logo from '../assets/logo.png'
import '../estilos/app.css'

const DURACION_PORTADA = 1500
const ID_REFUERZO = 'refuerzo'

// La mascota es la IA: tocarla, a ella o a su bocadillo, abre el chat.
function MascotaIA({ estado, onPreguntar, bocadillo = false }) {
  return (
    <div className="mascota-fila">
      {/* Con bocadillo, los dos botones hacen lo mismo: el teclado y los lectores de pantalla solo necesitan uno. */}
      <button
        className="mascota-boton"
        aria-label={bocadillo ? undefined : t('preguntarMascota')}
        aria-hidden={bocadillo || undefined}
        tabIndex={bocadillo ? -1 : undefined}
        onClick={onPreguntar}
      >
        <Mascota estado={estado} />
      </button>
      {bocadillo && <button className="bocadillo" onClick={onPreguntar}>{t('bocadillo')}</button>}
    </div>
  )
}

function BarraProgreso({ completadas, total }) {
  return (
    <div className="progreso" role="progressbar" aria-label={t('progreso')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completadas}>
      <div className="progreso-relleno" style={{ width: `${(completadas / total) * 100}%` }} />
    </div>
  )
}

export default function App() {
  const [portada, setPortada] = useState(true)
  const [versionNueva, setVersionNueva] = useState(false)
  const [cuenta, setCuenta] = useState(cuentaActual)
  const [pinDocente, setPinDocente] = useState(null)
  const [pantalla, setPantalla] = useState(cuenta ? 'menu' : 'acceso')
  const [pasoAcceso, setPasoAcceso] = useState('inicio')
  const [seccion, setSeccion] = useState('lecciones')
  const [panel, setPanel] = useState(null)
  const [lecciones, setLecciones] = useState(leerLecciones)
  const [tests, setTests] = useState(leerTests)
  const [leccion, setLeccion] = useState(null)
  const [actual, setActual] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [acierto, setAcierto] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [nuevoAlias, setNuevoAlias] = useState('')
  const [errorAlias, setErrorAlias] = useState('')
  const [ajustes, setAjustes] = useState(leerAjustes)
  const [, setIdioma] = useState(() => idiomaActual().codigo)
  const botonSiguiente = useRef(null)

  const refrescar = useCallback(() => {
    setLecciones(leerLecciones())
    setTests(leerTests())
    setCuenta(cuentaActual())
  }, [])

  const sincronizarYRefrescar = () => sincronizar().then(refrescar)

  useEffect(() => {
    const conectar = () => {
      setOnline(true)
      sincronizar().then(refrescar)
    }
    const desconectar = () => setOnline(false)
    window.addEventListener('online', conectar)
    window.addEventListener('offline', desconectar)
    sincronizar().then(refrescar)
    return () => {
      window.removeEventListener('online', conectar)
      window.removeEventListener('offline', desconectar)
    }
  }, [refrescar])

  useEffect(() => {
    const temporizador = setTimeout(() => setPortada(false), DURACION_PORTADA)
    return () => clearTimeout(temporizador)
  }, [])

  // Con cada publicación, el service worker descarga la versión nueva y toma el control.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker
    // Sin controlador previo es la primera instalación: la página ya es la última versión.
    const habiaVersion = Boolean(sw.controller)
    const alCambiar = () => {
      if (habiaVersion) setVersionNueva(true)
    }
    // Una app que vuelve del segundo plano no navega, así que hay que pedirle que compruebe.
    const alVolver = () => {
      if (document.visibilityState === 'visible') sw.getRegistration().then((r) => r?.update()).catch(() => {})
    }
    sw.addEventListener('controllerchange', alCambiar)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      sw.removeEventListener('controllerchange', alCambiar)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  // Solo se recarga en pantallas sin trabajo a medias; en un quiz, al volver al menú.
  useEffect(() => {
    if (versionNueva && (pantalla === 'menu' || pantalla === 'acceso')) window.location.reload()
  }, [versionNueva, pantalla])

  // Cada pantalla nueva lleva el foco a su título y actualiza el título de la pestaña.
  useEffect(() => {
    if (portada) return
    enfocarTitulo()
    document.title = `${document.querySelector('main h1')?.textContent ?? ''} · EduGo`
  }, [portada, pantalla, actual, pasoAcceso])

  // Tras responder, el botón pulsado queda desactivado: el foco pasa a «Siguiente».
  useEffect(() => {
    if (acierto !== null) botonSiguiente.current?.focus()
  }, [acierto])

  // Lectura automática, para quien lo activa en Accesibilidad.
  useEffect(() => {
    if (!ajustes.leerSolo || pantalla !== 'quiz') return
    if (acierto === null) hablar(textoTarea(leccion.preguntas[actual]))
    else hablar(t(acierto ? 'muyBien' : 'casi'), undefined, idiomaActual().voz)
    return callar
  }, [ajustes.leerSolo, pantalla, actual, acierto, leccion])

  function cambiarAjustes(nuevos) {
    guardarAjustes(nuevos)
    setAjustes(nuevos)
  }

  async function seleccionarIdioma(codigo) {
    setIdioma(await cambiarIdioma(codigo))
  }

  function entrarComoAlumno(c) {
    setCuenta(c)
    setPantalla('menu')
    sincronizarYRefrescar()
  }

  function entrarComoDocente(pin) {
    setPinDocente(pin)
    setPantalla('docente')
  }

  function salirDocente() {
    setPinDocente(null)
    setPanel(null)
    setPasoAcceso('inicio')
    setPantalla('acceso')
  }

  function salirAlumno() {
    cerrarSesion()
    setCuenta(null)
    setPanel(null)
    setPasoAcceso('inicio')
    setPantalla('acceso')
  }

  function guardarNuevoAlias() {
    const r = cambiarAlias(cuenta, nuevoAlias)
    setErrorAlias(r.error ?? '')
    if (r.cuenta) {
      setCuenta(r.cuenta)
      setNuevoAlias('')
      sincronizarYRefrescar()
    }
  }

  function empezar(l, destino) {
    setLeccion(l)
    setActual(0)
    setPuntos(0)
    setAcierto(null)
    setPantalla(destino)
  }

  function empezarTest(test) {
    empezar({ ...test, preguntas: elegirPreguntasTest(cuenta.alias, test) }, 'quiz')
  }

  function repetir() {
    const test = tests.find((t) => t.id === leccion.id)
    if (test) empezarTest(test)
    else empezar(leccion, 'quiz')
  }

  function empezarRefuerzo() {
    empezar({ id: ID_REFUERZO, preguntas: tareasParaReforzar(cuenta.alias, [...lecciones, ...tests]) }, 'quiz')
  }

  function responder(correcta) {
    const tarea = leccion.preguntas[actual]
    registrarRespuesta(cuenta.alias, tarea.clave ?? claveTarea(leccion.id, tarea), correcta)
    setAcierto(correcta)
    if (correcta) setPuntos(puntos + 1)
  }

  function siguiente() {
    setAcierto(null)
    if (actual + 1 < leccion.preguntas.length) {
      setActual(actual + 1)
    } else if (leccion.id === ID_REFUERZO) {
      // El refuerzo es práctica: no cuenta como nota para el profesor.
      setPantalla('fin')
    } else {
      guardarResultado({
        alias: cuenta.alias,
        leccion: leccion.id,
        puntos,
        total: leccion.preguntas.length,
        fecha: new Date().toISOString(),
      })
      setPantalla('fin')
      sincronizarYRefrescar()
    }
  }

  const abrirIA = () => setPanel('ia')

  function alternarPanel(nombre) {
    setPanel(panel === nombre ? null : nombre)
  }

  const enActividad = pantalla === 'leccion' || pantalla === 'quiz' || pantalla === 'fin'
  const enTest = pantalla === 'quiz' && tests.some((t) => t.id === leccion?.id)
  // Solo una lección real da contexto: los tests y el refuerzo no tienen texto que explicar.
  const leccionAbierta = enActividad && lecciones.some((l) => l.id === leccion?.id) ? leccion : null

  const pendientes = cuenta ? contarPendientes(cuenta.alias) : 0

  if (portada) {
    return (
      <main className="portada">
        <img src={logo} alt="" />
        <h1>EduGo</h1>
      </main>
    )
  }

  // En pantallas estrechas el panel abierto tapa el resto: el teclado no debe poder ir a lo que no se ve.
  const contenidoTapado = panel !== null && window.matchMedia('(max-width: 40rem)').matches
  const pregunta = pantalla === 'quiz' ? leccion.preguntas[actual] : null

  return (
    <div className={pantalla === 'acceso' ? 'app' : 'app con-pizarra'}>
      <header inert={contenidoTapado}>
        <div className="barra">
          {!(pantalla === 'acceso' && pasoAcceso === 'inicio') && <img className="logo-mini" src={logo} alt="EduGo" />}
          <div className={online ? 'estado conectado' : 'estado sin-conexion'} role="status">
            {online ? t('conectado') : t('sinConexion')}
          </div>
        </div>
        <AjustesAccesibilidad ajustes={ajustes} onCambiar={cambiarAjustes} onCambiarIdioma={seleccionarIdioma} />
      </header>

      <main inert={contenidoTapado}>
        {pantalla === 'acceso' && (
          <Acceso paso={pasoAcceso} onCambiarPaso={setPasoAcceso} onAlumno={entrarComoAlumno} onDocente={entrarComoDocente} />
        )}

        {pantalla === 'docente' && (
          <PanelDocente
            pin={pinDocente}
            online={online}
            onSalir={salirDocente}
            onLeccionesCambiadas={refrescar}
          />
        )}

        {pantalla === 'menu' && (
          <div>
            <h1>{t('hola', { alias: cuenta.alias })}</h1>
            <MascotaIA estado="normal" onPreguntar={abrirIA} />
            <p className="mensaje-mascota"><span className="ayuda">{t('tocaMascota')}</span></p>
            {cuenta.conflicto && (
              <div className="conflicto">
                <p className="error" role="alert">{t('conflictoAlias')}</p>
                <input aria-label={t('nuevoAlias')} value={nuevoAlias} maxLength={30} onChange={(e) => setNuevoAlias(e.target.value)} />
                {errorAlias && <p className="error" role="alert">{errorAlias}</p>}
                <button onClick={guardarNuevoAlias}>{t('cambiarAlias')}</button>
              </div>
            )}
            <MenuAlumno
              seccion={seccion}
              lecciones={lecciones}
              tests={tests}
              refuerzo={tareasParaReforzar(cuenta.alias, [...lecciones, ...tests])}
              onSeccion={setSeccion}
              onLeer={(l) => empezar(l, 'leccion')}
              onTest={empezarTest}
              onRefuerzo={empezarRefuerzo}
            />
            <button className="secundario" onClick={salirAlumno}>{t('cerrarSesion')}</button>
          </div>
        )}

        {pantalla === 'leccion' && (
          <div>
            <p lang="es">{leccion.asignatura}</p>
            <h1 lang="es">{leccion.titulo}</h1>
            <MascotaIA estado="normal" onPreguntar={abrirIA} bocadillo />
            <Ilustracion id={leccion.preguntas[0]?.imagen} />
            <p lang="es">{leccion.texto}</p>
            <BotonEscuchar texto={leccion.texto} />
            <button onClick={() => setPantalla('quiz')}>{t('hacerActividades')}</button>
            <button className="secundario" onClick={() => setPantalla('menu')}>{t('volverMenu')}</button>
          </div>
        )}

        {pantalla === 'quiz' && (
          <div>
            <BarraProgreso completadas={actual + (acierto === null ? 0 : 1)} total={leccion.preguntas.length} />
            <MascotaIA estado={acierto === null ? 'normal' : acierto ? 'contenta' : 'animando'} onPreguntar={abrirIA} bocadillo />
            <p className="mensaje-mascota" role="status">
              {acierto === true && t('muyBien')}
              {acierto === false && t('casi')}
            </p>
            <p>{t('preguntaDe', { n: actual + 1, total: leccion.preguntas.length })}</p>
            <h1 className="pregunta" lang="es">{pregunta.pregunta}</h1>
            <Ilustracion id={pregunta.imagen} />
            <BotonEscuchar key={actual} texto={textoTarea(pregunta)} />
            <div lang="es">
              <Actividad key={actual} tarea={pregunta} onResponder={responder} />
            </div>
            {acierto !== null && (
              <button ref={botonSiguiente} className="siguiente" onClick={siguiente}>
                {actual + 1 < leccion.preguntas.length ? t('siguiente') : t('verResultado')}
              </button>
            )}
          </div>
        )}

        {pantalla === 'fin' && (
          <div>
            <MascotaIA estado={puntos * 2 >= leccion.preguntas.length ? 'contenta' : 'animando'} onPreguntar={abrirIA} />
            <h1>{t('terminaste')}</h1>
            <p>{t('acertaste', { puntos, total: leccion.preguntas.length })}</p>
            {leccion.id !== ID_REFUERZO && (
              <>
                <p>{t('pendientes', { n: pendientes })}</p>
                <button onClick={repetir}>{t('repetir')}</button>
              </>
            )}
            <button className="secundario" onClick={() => setPantalla('menu')}>{t('volverMenu')}</button>
          </div>
        )}
      </main>

      {/* Después del contenido en el orden del teclado. Fuera de las pantallas para mantener el dibujo
          al navegar; al cerrar sesión se borra. */}
      {pantalla !== 'acceso' && (
        <>
          <Pizarra abierta={panel === 'pizarra'} oculta={panel === 'ia'} onAlternar={() => alternarPanel('pizarra')} />
          <Asistente
            abierta={panel === 'ia'}
            oculta={panel === 'pizarra'}
            onAlternar={() => alternarPanel('ia')}
            lecciones={lecciones}
            leccionActual={leccionAbierta}
            enTest={enTest}
          />
        </>
      )}
    </div>
  )
}
