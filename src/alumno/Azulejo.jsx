import { estiloDe } from './asignaturas'

// Cuadrado de color con el icono de la asignatura, o con el que se le pase.
export default function Azulejo({ asignatura, tono, redondo = false, children }) {
  const { Icono, tono: tonoAsignatura } = estiloDe(asignatura)
  return (
    <span className={`azulejo tono-${tono ?? tonoAsignatura}${redondo ? ' redondo' : ''}`}>
      {children ?? <Icono />}
    </span>
  )
}
