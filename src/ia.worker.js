import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

// El modelo se ejecuta aquí para que la pantalla no se congele mientras responde.
const manejador = new WebWorkerMLCEngineHandler()
self.onmessage = (mensaje) => manejador.onmessage(mensaje)
