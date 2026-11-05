import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/base.css'
import App from './app/App.jsx'
import { aplicarAjustes, leerAjustes } from './accesibilidad/accesibilidad'
import { cargarIdioma, idiomaGuardado } from './idiomas/i18n'

// Antes del primer dibujo, para que no aparezca un instante con otros ajustes u otro idioma.
aplicarAjustes(leerAjustes())
cargarIdioma(idiomaGuardado()).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
