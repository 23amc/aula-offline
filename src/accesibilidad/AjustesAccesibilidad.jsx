import { hayVoz, TAMANOS } from './accesibilidad'
import { IDIOMAS, idiomaActual, t } from '../idiomas/i18n'

function Opcion({ etiqueta, activa, onCambiar }) {
  return (
    <label className="ajuste">
      <input type="checkbox" checked={activa} onChange={(e) => onCambiar(e.target.checked)} />
      {etiqueta}
    </label>
  )
}

export default function AjustesAccesibilidad({ ajustes, onCambiar, onCambiarIdioma }) {
  const cambiar = (cambios) => onCambiar({ ...ajustes, ...cambios })

  return (
    <div className="ajustes-fila">
      <label className="selector-idioma">
        <span aria-hidden="true">🌐 </span>{t('idioma')}
        <select value={idiomaActual().codigo} onChange={(e) => onCambiarIdioma(e.target.value)}>
          {IDIOMAS.map((i) => <option key={i.codigo} value={i.codigo} lang={i.codigo}>{i.nombre}</option>)}
        </select>
      </label>
      <details className="accesibilidad">
        <summary>{t('accesibilidad')}</summary>
        <fieldset>
          <legend>{t('tamano')}</legend>
          {TAMANOS.map((tamano) => (
            <label key={tamano.valor} className="ajuste">
              <input type="radio" name="tamano" checked={ajustes.tamano === tamano.valor} onChange={() => cambiar({ tamano: tamano.valor })} />
              {t(tamano.clave)}
            </label>
          ))}
        </fieldset>
        <Opcion etiqueta={t('altoContraste')} activa={ajustes.altoContraste} onCambiar={(v) => cambiar({ altoContraste: v })} />
        <Opcion etiqueta={t('letraLegible')} activa={ajustes.letraLegible} onCambiar={(v) => cambiar({ letraLegible: v })} />
        <Opcion etiqueta={t('quitarAnimaciones')} activa={ajustes.sinAnimaciones} onCambiar={(v) => cambiar({ sinAnimaciones: v })} />
        {hayVoz() && <Opcion etiqueta={t('leerSolo')} activa={ajustes.leerSolo} onCambiar={(v) => cambiar({ leerSolo: v })} />}
      </details>
    </div>
  )
}
