import { useState } from 'react'
import { docenteEntrar, entrarAlumno, registrarAlumno } from '../datos/almacen'
import { t } from '../idiomas/i18n'
import logo from '../assets/logo.png'

export default function Acceso({ paso, onCambiarPaso, onAlumno, onDocente }) {
  const [rol, setRol] = useState('alumno')
  const [alias, setAlias] = useState(localStorage.getItem('alias') || '')
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const esProfesor = rol === 'profesor'
  const creaCuenta = paso === 'registro' && !esProfesor

  function limpiar() {
    setPin('')
    setRepetido('')
    setError('')
  }

  function abrir(nuevoPaso) {
    limpiar()
    setRol('alumno')
    onCambiarPaso(nuevoPaso)
  }

  function cambiarRol(nuevoRol) {
    limpiar()
    setRol(nuevoRol)
  }

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (creaCuenta && pin !== repetido) {
      setError(t('pinNoCoincide'))
      return
    }
    setOcupado(true)
    if (esProfesor) {
      const r = await docenteEntrar(pin)
      setOcupado(false)
      if (r.error) setError(r.error)
      else onDocente(pin)
      return
    }
    const r = creaCuenta ? await registrarAlumno(alias, pin) : await entrarAlumno(alias, pin)
    setOcupado(false)
    if (r.error) setError(r.error)
    else onAlumno(r.cuenta)
  }

  if (paso === 'inicio') {
    return (
      <div className="inicio">
        <h1>EduGo</h1>
        <img src={logo} alt="" />
        <button onClick={() => abrir('registro')}>{t('registrarse')}</button>
        <button className="secundario" onClick={() => abrir('sesion')}>{t('inicioSesion')}</button>
      </div>
    )
  }

  const textoEnviar = creaCuenta ? t('crearCuenta') : paso === 'registro' ? t('registrarseProfesor') : t('iniciarSesion')
  const errorCampo = error ? { 'aria-invalid': true, 'aria-describedby': 'error-acceso' } : {}

  return (
    <div>
      <h1>{paso === 'registro' ? t('registrarse') : t('inicioSesion')}</h1>
      <p className="ayuda" id="rol-acceso">{paso === 'registro' ? t('quieroRegistrarme') : t('quieroIniciar')}</p>
      <div className="pestanas" role="group" aria-labelledby="rol-acceso">
        <button className={esProfesor ? 'secundario' : ''} aria-pressed={!esProfesor} onClick={() => cambiarRol('alumno')}>{t('alumno')}</button>
        <button className={esProfesor ? '' : 'secundario'} aria-pressed={esProfesor} onClick={() => cambiarRol('profesor')}>{t('profesor')}</button>
      </div>

      <form onSubmit={enviar}>
        {!esProfesor && (
          <label>
            {t('alias')}
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder={t('aliasEjemplo')} maxLength={30} autoComplete="username" required {...errorCampo} />
          </label>
        )}
        <label>
          {esProfesor ? t('pinProfesor') : creaCuenta ? t('creaPin') : t('pin')}
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete={creaCuenta ? 'new-password' : 'current-password'} required {...errorCampo} />
        </label>
        {esProfesor && paso === 'registro' && <p className="ayuda">{t('pinCompartido')}</p>}
        {creaCuenta && (
          <label>
            {t('repitePin')}
            <input type="password" inputMode="numeric" value={repetido} onChange={(e) => setRepetido(e.target.value)} autoComplete="new-password" required {...errorCampo} />
          </label>
        )}
        {error && <p id="error-acceso" className="error" role="alert">{error}</p>}
        <button type="submit" disabled={ocupado}>{ocupado ? t('unMomento') : textoEnviar}</button>
      </form>
      <button className="secundario" onClick={() => onCambiarPaso('inicio')}>{t('volver')}</button>
    </div>
  )
}
