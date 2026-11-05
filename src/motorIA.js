import { CreateWebWorkerMLCEngine, deleteModelAllInfoInCache } from '@mlc-ai/web-llm'

// Elegido tras comparar respuestas en español: los modelos más pequeños se inventaban datos.
const MODELO = 'gemma3-1b-it-q4f16_1-MLC'

// La primera vez descarga el modelo; después lo carga del móvil, también sin conexión.
export async function cargarMotor(onProgreso) {
  const adaptador = await navigator.gpu?.requestAdapter()
  if (!adaptador) throw new Error('Este dispositivo no tiene WebGPU')
  // Pide al navegador que no borre el modelo si le falta espacio.
  navigator.storage?.persist?.().catch(() => {})
  const trabajador = new Worker(new URL('./ia.worker.js', import.meta.url), { type: 'module' })
  return CreateWebWorkerMLCEngine(trabajador, MODELO, {
    initProgressCallback: (avance) => onProgreso(avance.progress),
  })
}

export const borrarModelo = () => deleteModelAllInfoInCache(MODELO)
