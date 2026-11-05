import { useState } from 'react'
import { docenteEntrar, entrarAlumno, registrarAlumno } from './datos'

export default function Acceso({ onAlumno, onDocente }) {
  const [modo, setModo] = useState('registro')
  const [alias, setAlias] = useState(localStorage.getItem('alias') || '')
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  function cambiarModo(nuevo) {
    setModo(nuevo)
    setPin('')
    setRepetido('')
    setError('')
  }

  async function enviar(e) {
    e.preventDefault()
    setError('')
    if (modo === 'registro' && pin !== repetido) {
      setError('Los dos PIN no coinciden.')
      return
    }
    setOcupado(true)
    if (modo === 'docente') {
      const r = await docenteEntrar(pin)
      setOcupado(false)
      if (r.error) setError(r.error)
      else onDocente(pin)
      return
    }
    const r = modo === 'registro' ? await registrarAlumno(alias, pin) : await entrarAlumno(alias, pin)
    setOcupado(false)
    if (r.error) setError(r.error)
    else onAlumno(r.cuenta)
  }

  return (
    <div>
      <h1>Aula Offline</h1>
      <div className="pestanas">
        <button className={modo === 'registro' ? '' : 'secundario'} onClick={() => cambiarModo('registro')}>Registrarse</button>
        <button className={modo === 'entrar' ? '' : 'secundario'} onClick={() => cambiarModo('entrar')}>Entrar</button>
        <button className={modo === 'docente' ? '' : 'secundario'} onClick={() => cambiarModo('docente')}>Profesor</button>
      </div>

      <form onSubmit={enviar}>
        {modo !== 'docente' && (
          <label>
            Alias (no uses tu nombre real)
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: Estrella-42" maxLength={30} autoComplete="username" required />
          </label>
        )}
        <label>
          {modo === 'docente' ? 'PIN de profesor' : modo === 'registro' ? 'Crea un PIN (4 a 8 números)' : 'PIN'}
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="off" required />
        </label>
        {modo === 'registro' && (
          <label>
            Repite el PIN
            <input type="password" inputMode="numeric" value={repetido} onChange={(e) => setRepetido(e.target.value)} autoComplete="off" required />
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={ocupado}>
          {ocupado ? 'Un momento…' : modo === 'registro' ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
