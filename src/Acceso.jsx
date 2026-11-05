import { useState } from 'react'
import { docenteEntrar, entrarAlumno, registrarAlumno } from './datos'
import logo from './assets/logo.png'

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
      setError('Los dos PIN no coinciden.')
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
        <img src={logo} alt="EduGo" />
        <button onClick={() => abrir('registro')}>Registrarse</button>
        <button className="secundario" onClick={() => abrir('sesion')}>Inicio de sesión</button>
      </div>
    )
  }

  const textoEnviar = creaCuenta ? 'Crear cuenta' : paso === 'registro' ? 'Registrarse como profesor' : 'Iniciar sesión'

  return (
    <div>
      <h1>{paso === 'registro' ? 'Registrarse' : 'Inicio de sesión'}</h1>
      <p className="ayuda">{paso === 'registro' ? 'Quiero registrarme como:' : 'Quiero iniciar sesión como:'}</p>
      <div className="pestanas">
        <button className={esProfesor ? 'secundario' : ''} aria-pressed={!esProfesor} onClick={() => cambiarRol('alumno')}>Alumno</button>
        <button className={esProfesor ? '' : 'secundario'} aria-pressed={esProfesor} onClick={() => cambiarRol('profesor')}>Profesor</button>
      </div>

      <form onSubmit={enviar}>
        {!esProfesor && (
          <label>
            Alias (no uses tu nombre real)
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: Estrella-42" maxLength={30} autoComplete="username" required />
          </label>
        )}
        <label>
          {esProfesor ? 'PIN de profesor' : creaCuenta ? 'Crea un PIN (4 a 8 números)' : 'PIN'}
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" required />
        </label>
        {esProfesor && paso === 'registro' && (
          <p className="ayuda">Los profesores comparten un único PIN del centro.</p>
        )}
        {creaCuenta && (
          <label>
            Repite el PIN
            <input type="password" inputMode="numeric" value={repetido} onChange={(e) => setRepetido(e.target.value)} autoComplete="off" required />
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={ocupado}>{ocupado ? 'Un momento…' : textoEnviar}</button>
      </form>
      <button className="secundario" onClick={() => onCambiarPaso('inicio')}>Volver</button>
    </div>
  )
}
