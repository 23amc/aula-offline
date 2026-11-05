import { PREGUNTAS_POR_TEST } from '../datos/almacen'
import { idiomaActual, t } from '../idiomas/i18n'

const SECCIONES = [
  { id: 'lecciones', clave: 'secLecciones' },
  { id: 'tests', clave: 'secTests' },
  { id: 'refuerzo', clave: 'secRefuerzo', clase: 'naranja' },
]

export default function MenuAlumno({ seccion, lecciones, tests, refuerzo, onSeccion, onLeer, onTest, onRefuerzo }) {
  return (
    <div>
      <div className="pestanas secciones">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            className={s.clase ?? (seccion === s.id ? '' : 'secundario')}
            aria-pressed={seccion === s.id}
            onClick={() => onSeccion(s.id)}
          >{t(s.clave)}</button>
        ))}
      </div>

      {idiomaActual().codigo !== 'es' && <p className="ayuda">{t('contenidoEspanol')}</p>}

      {seccion === 'lecciones' && (
        <>
          <p>{t('introLecciones')}</p>
          {lecciones.map((l) => (
            <button key={l.id} lang="es" onClick={() => onLeer(l)}>{l.asignatura}: {l.titulo}</button>
          ))}
        </>
      )}

      {seccion === 'tests' && (
        <>
          <p>{t('introTests')}</p>
          {tests.map((test) => (
            <button key={test.id} onClick={() => onTest(test)}>
              <span lang="es">{test.titulo}</span> ({t('nPreguntas', { n: Math.min(test.preguntas.length, PREGUNTAS_POR_TEST) })})
            </button>
          ))}
        </>
      )}

      {seccion === 'refuerzo' && (refuerzo.length === 0 ? (
        <p>{t('nadaReforzar')}</p>
      ) : (
        <>
          <p>{t('introRefuerzo')}</p>
          <ul className="lista-refuerzo">
            {refuerzo.map((tarea) => (
              <li key={tarea.clave}>
                <span lang="es">{tarea.pregunta}</span>
                <small><span lang="es">{tarea.asignatura}</span> · {tarea.saldo === 1 ? t('falladaUna') : t('falladaVarias', { n: tarea.saldo })}</small>
              </li>
            ))}
          </ul>
          <button className="naranja" onClick={onRefuerzo}>{t('empezarRefuerzo')}</button>
        </>
      ))}
    </div>
  )
}
