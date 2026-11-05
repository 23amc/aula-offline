const SECCIONES = [
  { id: 'lecciones', nombre: 'Lecciones' },
  { id: 'tests', nombre: 'Tests' },
  { id: 'refuerzo', nombre: 'Refuerzo', clase: 'naranja' },
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
          >{s.nombre}</button>
        ))}
      </div>

      {seccion === 'lecciones' && (
        <>
          <p>Todas las lecciones de tus profesores:</p>
          {lecciones.map((l) => (
            <button key={l.id} onClick={() => onLeer(l)}>{l.asignatura}: {l.titulo}</button>
          ))}
        </>
      )}

      {seccion === 'tests' && (
        <>
          <p>Preguntas nuevas, distintas de las de las lecciones, para ponerte a prueba:</p>
          {tests.map((t) => (
            <button key={t.id} onClick={() => onTest(t)}>{t.titulo} ({t.preguntas.length} preguntas)</button>
          ))}
        </>
      )}

      {seccion === 'refuerzo' && (refuerzo.length === 0 ? (
        <p>¡Nada que reforzar! Las tareas que falles en los tests aparecerán aquí.</p>
      ) : (
        <>
          <p>Lo que más te cuesta ahora mismo. Cuando aciertes, irá desapareciendo de la lista:</p>
          <ul className="lista-refuerzo">
            {refuerzo.map((t) => (
              <li key={t.clave}>
                <span>{t.pregunta}</span>
                <small>{t.asignatura} · fallada {t.saldo === 1 ? '1 vez' : `${t.saldo} veces`}</small>
              </li>
            ))}
          </ul>
          <button className="naranja" onClick={onRefuerzo}>Empezar refuerzo</button>
        </>
      ))}
    </div>
  )
}
