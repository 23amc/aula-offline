// Iconos de línea de la interfaz. Son decorativos: el nombre lo pone siempre el botón o el texto de al lado.
function Icono({ children, relleno = false }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'} stroke={relleno ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const Casa = () => <Icono><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></Icono>
export const Libro = () => <Icono><path d="M12 7c-2-1.6-4.6-2-8-2v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2V5c-3.4 0-6 .4-8 2z" /><path d="M12 7v13" /></Icono>
export const Barras = () => <Icono><path d="M6 20v-7" /><path d="M12 20V5" /><path d="M18 20v-10" /></Icono>
export const Persona = () => <Icono><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" /></Icono>
export const CalendarioIcono = () => <Icono><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M4 10.5h16" /><path d="M8.5 3.5v4M15.5 3.5v4" /></Icono>
export const Hoja = () => <Icono><path d="M5 19C4 10 10 4 20 4c0 10-6 16-15 15z" /><path d="M5 19 14 10" /></Icono>
export const Globo = () => <Icono><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3.5 15 0 18-3.5-3-3-15 0-18z" /></Icono>
export const Operaciones = () => <Icono><path d="M7 4v6M4 7h6" /><path d="M14 7h6" /><path d="m4.5 15 5 5M9.5 15l-5 5" /><path d="M14 15.5h6M14 19.5h6" /></Icono>
export const Duda = () => <Icono><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.700 2.200c-.8.5-1.200 1-1.200 2" /><path d="M12 17h.01" /></Icono>
export const Atras = () => <Icono><path className="icono-direccion" d="m14.5 5-7 7 7 7" /></Icono>
export const Adelante = () => <Icono><path className="icono-direccion" d="m9.5 5 7 7-7 7" /></Icono>
export const FlechaDerecha = () => <Icono><g className="icono-direccion"><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></g></Icono>
export const Cerrar = () => <Icono><path d="M6 6l12 12M18 6 6 18" /></Icono>
export const Marcador = ({ activo }) => <Icono relleno={activo}><path d="M6 3.5h12V21l-6-4.5L6 21z" /></Icono>
export const Cuadricula = () => <Icono><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Icono>
export const Lista = () => <Icono><path d="M4 6h16M4 12h16M4 18h16" /></Icono>
export const Check = () => <Icono><path d="m5 13 4.5 4.5L19 7.5" /></Icono>
export const Estrella = () => <Icono relleno><path d="m12 2.5 2.900 6.300 6.900.8-5.100 4.700 1.400 6.800-6.100-3.400-6.100 3.400 1.400-6.800-5.100-4.700 6.900-.8z" /></Icono>
