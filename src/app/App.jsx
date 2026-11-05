import { useCallback, useEffect, useRef, useState } from 'react'
import AjustesAccesibilidad from '../accesibilidad/AjustesAccesibilidad'
import { callar, enfocarTitulo, guardarAjustes, hablar, leerAjustes } from '../accesibilidad/accesibilidad'
import Acceso from '../acceso/Acceso'
import { claveTarea, textoTarea } from '../alumno/actividades'
import { cambiarIdioma, idiomaActual, t } from '../idiomas/i18n'
import Asistente from '../ia/Asistente'
import MenuAlumno, { Navegacion } from '../alumno/MenuAlumno'
import PantallaFin from '../alumno/PantallaFin'
import PantallaLeccion from '../alumno/PantallaLeccion'
import PantallaQuiz from '../alumno/PantallaQuiz'
import Pizarra from '../herramientas/Pizarra'
import PanelDocente from '../docente/PanelDocente'
import {
  alternarGuardada,
  cambiarAlias,
  cerrarSesion,
  contarPendientes,
  elegirPreguntasTest,
  cuentaActual,
  guardadasDe,
  guardarResultado,
  leerLecciones,
  leerTests,
  registrarRespuesta,
  resultadosDe,
  sincronizar,
  tareasParaReforzar,
} from '../datos/almacen'
import logo from '../assets/logo.png'
import '../estilos/app.css'

const DURACION_PORTADA = 1500
const ID_REFUERZO = 'refuerzo'

export default function App() {
  const [portada, setPortada] = useState(true)
  const [versionNueva, setVersionNueva] = useState(false)
  const [cuenta, setCuenta] = useState(cuentaActual)
  const [pinDocente, setPinDocente] = useState(null)
  const [pantalla, setPantalla] = useState(cuenta ? 'menu' : 'acceso')
  const [pasoAcceso, setPasoAcceso] = useState('inicio')
  const [vista, setVista] = useState('inicio')
  const [seccion, setSeccion] = useState('lecciones')
  const [guardadas, setGuardadas] = useState(() => (cuenta ? guardadasDe(cuenta.alias) : []))
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
    window.scrollTo(0, 0)
    document.title = `${document.querySelector('main h1')?.textContent ?? ''} · EduGo`
  }, [portada, pantalla, vista, actual, pasoAcceso])

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
    setGuardadas(guardadasDe(c.alias))
    setVista('inicio')
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

  function volverMenu() {
    setPanel(null)
    setPantalla('menu')
  }

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
  const enMenu = pantalla === 'menu'

  return (
    <div className={`app pantalla-${pantalla}`}>
      <header inert={contenidoTapado}>
        <div className={online ? 'estado conectado sr-only' : 'estado sin-conexion'} role="status">
          {online ? t('conectado') : t('sinConexion')}
        </div>
        {pantalla === 'docente' && (
          <div className="marca">
            <img src={logo} alt="" />
            <span>EduGo</span>
          </div>
        )}
        {(pantalla === 'acceso' || pantalla === 'docente') && (
          <AjustesAccesibilidad ajustes={ajustes} onCambiar={cambiarAjustes} onCambiarIdioma={seleccionarIdioma} />
        )}
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

        {enMenu && (
          <>
            {cuenta.conflicto && (
              <div className="conflicto">
                <p className="error" role="alert">{t('conflictoAlias')}</p>
                <input aria-label={t('nuevoAlias')} value={nuevoAlias} maxLength={30} onChange={(e) => setNuevoAlias(e.target.value)} />
                {errorAlias && <p className="error" role="alert">{errorAlias}</p>}
                <button onClick={guardarNuevoAlias}>{t('cambiarAlias')}</button>
              </div>
            )}
            <MenuAlumno
              vista={vista}
              seccion={seccion}
              cuenta={cuenta}
              lecciones={lecciones}
              tests={tests}
              refuerzo={tareasParaReforzar(cuenta.alias, [...lecciones, ...tests])}
              resultados={resultadosDe(cuenta.alias)}
              guardadas={guardadas}
              online={online}
              ajustes={ajustes}
              onCambiarAjustes={cambiarAjustes}
              onCambiarIdioma={seleccionarIdioma}
              onSalir={salirAlumno}
              onVista={setVista}
              onSeccion={setSeccion}
              onLeer={(l) => empezar(l, 'leccion')}
              onTest={empezarTest}
              onRefuerzo={empezarRefuerzo}
              onPreguntar={abrirIA}
            />
          </>
        )}

        {pantalla === 'leccion' && (
          <PantallaLeccion
            leccion={leccion}
            guardada={guardadas.includes(leccion.id)}
            onGuardar={() => setGuardadas(alternarGuardada(cuenta.alias, leccion.id))}
            onPreguntar={abrirIA}
            onActividades={() => setPantalla('quiz')}
            onVolver={volverMenu}
          />
        )}

        {pantalla === 'quiz' && (
          <PantallaQuiz
            leccion={leccion}
            actual={actual}
            acierto={acierto}
            botonSiguiente={botonSiguiente}
            onResponder={responder}
            onSiguiente={siguiente}
            onPreguntar={abrirIA}
            onSalir={volverMenu}
          />
        )}

        {pantalla === 'fin' && (
          <PantallaFin
            puntos={puntos}
            total={leccion.preguntas.length}
            resultados={resultadosDe(cuenta.alias)}
            pendientes={pendientes}
            esRefuerzo={leccion.id === ID_REFUERZO}
            onRepetir={repetir}
            onVolver={volverMenu}
          />
        )}
      </main>

      {enMenu && <Navegacion vista={vista} onVista={setVista} tapada={contenidoTapado} />}

      {/* Después del contenido en el orden del teclado. Fuera de las pantallas para mantener el dibujo
          al navegar; al cerrar sesión se borra. */}
      {pantalla !== 'acceso' && (
        <>
          <Pizarra abierta={panel === 'pizarra'} oculta={panel === 'ia' || enMenu} onAlternar={() => alternarPanel('pizarra')} />
          <Asistente
            abierta={panel === 'ia'}
            oculta={panel === 'pizarra'}
            sinPestana={enMenu}
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
