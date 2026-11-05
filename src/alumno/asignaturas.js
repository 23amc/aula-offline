import { Duda, Globo, Hoja, Libro, Operaciones } from '../interfaz/Iconos'

const ASIGNATURAS = {
  'Matemáticas': { Icono: Operaciones, tono: 'amarillo' },
  'Literatura': { Icono: Libro, tono: 'azul' },
  'Química': { Icono: Hoja, tono: 'verde' },
  'Física': { Icono: Globo, tono: 'coral' },
}
const TONOS = ['azul', 'amarillo', 'verde', 'coral']

// Las asignaturas que añada el profesor reciben siempre el mismo color, derivado de su nombre.
export function estiloDe(asignatura = '') {
  if (ASIGNATURAS[asignatura]) return ASIGNATURAS[asignatura]
  const suma = [...asignatura].reduce((total, letra) => total + letra.charCodeAt(0), 0)
  return { Icono: Duda, tono: TONOS[suma % TONOS.length] }
}
