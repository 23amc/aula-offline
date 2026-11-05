// Desplegable del borde derecho. Se oculta sin desmontarse para conservar su contenido.
export default function PanelLateral({ nombre, posicion, abierto, onAlternar, children }) {
  return (
    <aside className={abierto ? 'panel-lateral abierto' : 'panel-lateral'}>
      <button className={`panel-pestana panel-pestana-${posicion}`} aria-expanded={abierto} onClick={onAlternar}>
        {abierto ? 'Cerrar' : nombre}
      </button>
      <div className="panel-contenido" inert={!abierto}>{children}</div>
    </aside>
  )
}
