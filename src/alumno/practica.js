// Ejercicios de matemáticas generados al momento, infinitos y sin conexión. Cada uno trae su explicación paso a paso.
export const TEMAS_PRACTICA = [
  { id: 'sumas', signo: '+', tono: 'azul' },
  { id: 'restas', signo: '−', tono: 'coral' },
  { id: 'multiplicaciones', signo: '×', tono: 'amarillo' },
  { id: 'divisiones', signo: '÷', tono: 'verde' },
  { id: 'fracciones', signo: '½', tono: 'azul' },
  { id: 'problemas', signo: '?', tono: 'coral' },
]
export const NIVELES = [1, 2, 3]
export const EJERCICIOS_POR_PRACTICA = 10

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
const elegir = (lista) => lista[azar(0, lista.length - 1)]
const POSICIONES = ['unidades', 'decenas', 'centenas', 'unidades de millar']
const cifras = (n) => String(n).split('').reverse().map(Number)

function tarea(pregunta, respuesta, pasos, extra = {}) {
  return { tipo: 'problema', pregunta, respuesta: String(respuesta), pasos, ...extra }
}

// ---------- Sumas y restas en columna ----------

function pasosSuma(a, b) {
  const r = a + b
  if (a < 10 && b < 10) {
    const cuenta = Array.from({ length: b }, (_, i) => a + i + 1).join(', ')
    return [`Empieza en el ${a} y cuenta ${b} más: ${cuenta}.`, `Resultado: ${a} + ${b} = ${r}.`]
  }
  const da = cifras(a)
  const db = cifras(b)
  const pasos = [`Coloca los números uno debajo del otro: unidades con unidades, decenas con decenas.`]
  let llevo = 0
  for (let i = 0; i < Math.max(da.length, db.length); i++) {
    const x = da[i] ?? 0
    const y = db[i] ?? 0
    const s = x + y + llevo
    const ultima = i === Math.max(da.length, db.length) - 1
    let paso = `Suma las ${POSICIONES[i]}: ${x} + ${y}${llevo ? ' + 1 que te llevabas' : ''} = ${s}.`
    if (s >= 10 && !ultima) paso += ` Escribes ${s % 10} y te llevas 1.`
    pasos.push(paso)
    llevo = s >= 10 ? 1 : 0
  }
  pasos.push(`Resultado: ${a} + ${b} = ${r}.`)
  return pasos
}

function pasosResta(a, b) {
  const r = a - b
  if (a <= 20 && b < 10) {
    const cuenta = Array.from({ length: b }, (_, i) => a - i - 1).join(', ')
    return [`Empieza en el ${a} y cuenta ${b} hacia atrás: ${cuenta}.`, `Resultado: ${a} − ${b} = ${r}.`, `Compruébalo: ${r} + ${b} = ${a}.`]
  }
  const da = cifras(a)
  const db = cifras(b)
  const pasos = [`Coloca el número mayor arriba y el menor debajo, cada cifra en su columna.`]
  let pedido = 0
  for (let i = 0; i < da.length; i++) {
    const x = da[i] - pedido
    const y = db[i] ?? 0
    if (i >= db.length && pedido === 0) {
      pasos.push(`Baja las ${POSICIONES[i]}: ${x}.`)
      continue
    }
    const nombre = POSICIONES[i][0].toUpperCase() + POSICIONES[i].slice(1)
    if (x < 0) {
      pasos.push(`${nombre}: el 0 no puede prestar, así que pide 1 a la cifra de al lado y se queda en 9. 9 − ${y} = ${9 - y}.`)
    } else if (x < y) {
      pasos.push(`${POSICIONES[i][0].toUpperCase() + POSICIONES[i].slice(1)}: ${x} es menor que ${y}, así que pides 1 a la cifra de al lado. ${x + 10} − ${y} = ${x + 10 - y}.`)
      pedido = 1
    } else {
      pasos.push(`Resta las ${POSICIONES[i]}: ${x} − ${y} = ${x - y}${pedido ? ' (ya habías quitado 1 que prestaste)' : ''}.`)
      pedido = 0
    }
  }
  pasos.push(`Resultado: ${a} − ${b} = ${r}. Compruébalo: ${r} + ${b} = ${a}.`)
  return pasos
}

function suma(nivel) {
  const rango = [[1, 9], [10, 99], [100, 999]][nivel - 1]
  const a = azar(...rango)
  const b = azar(...rango)
  return tarea(`¿Cuánto es ${a} + ${b}?`, a + b, pasosSuma(a, b), { imagen: nivel === 1 && a + b <= 10 ? `manzanas:${a}+${b}` : undefined })
}

function resta(nivel) {
  const rango = [[2, 18], [20, 99], [100, 999]][nivel - 1]
  const a = azar(...rango)
  const b = nivel === 1 ? azar(1, Math.min(9, a - 1)) : azar(Math.ceil(rango[0] / 2), a - 1)
  return tarea(`¿Cuánto es ${a} − ${b}?`, a - b, pasosResta(a, b), { imagen: nivel === 1 && a <= 10 ? `manzanas:${a}-${b}` : undefined })
}

// ---------- Multiplicar y dividir ----------

function pasosMultiplicar(a, b) {
  const r = a * b
  if (a <= 10 && b <= 10) {
    if (b <= 5) return [`Multiplicar es sumar el mismo número varias veces.`, `${a} × ${b} es sumar ${b} veces el ${a}: ${Array(b).fill(a).join(' + ')} = ${r}.`, `Resultado: ${r}.`]
    return [`Usa la tabla del ${a}.`, `${a} × ${b - 1} = ${a * (b - 1)}. Súmale otro ${a}: ${a * (b - 1)} + ${a} = ${r}.`, `Resultado: ${a} × ${b} = ${r}.`]
  }
  if (b <= 10) {
    const decenas = Math.floor(a / 10) * 10
    const unidades = a % 10
    return [
      `Separa el ${a} en ${decenas} y ${unidades}.`,
      `Multiplica cada parte por ${b}: ${decenas} × ${b} = ${decenas * b} y ${unidades} × ${b} = ${unidades * b}.`,
      `Suma los dos resultados: ${decenas * b} + ${unidades * b} = ${r}.`,
    ]
  }
  const decenas = Math.floor(b / 10) * 10
  const unidades = b % 10
  return [
    `Separa el ${b} en ${decenas} y ${unidades}.`,
    `${a} × ${decenas} = ${a * decenas} y ${a} × ${unidades} = ${a * unidades}.`,
    `Suma los dos resultados: ${a * decenas} + ${a * unidades} = ${r}.`,
  ]
}

function multiplicacion(nivel) {
  const a = [azar(2, 10), azar(11, 99), azar(11, 49)][nivel - 1]
  const b = [azar(1, 10), azar(2, 9), azar(11, 25)][nivel - 1]
  const imagen = a <= 5 && b <= 6 ? `grupos:${a}x${b}` : undefined
  return tarea(`¿Cuánto es ${a} × ${b}?`, a * b, pasosMultiplicar(a, b), { imagen })
}

function division(nivel) {
  const divisor = [azar(2, 5), azar(2, 9), azar(3, 12)][nivel - 1]
  const cociente = [azar(1, 6), azar(3, 12), azar(12, 40)][nivel - 1]
  const dividendo = divisor * cociente
  const pasos = [
    `Dividir es repartir en partes iguales: ${dividendo} entre ${divisor}.`,
    nivel < 3
      ? `Busca en la tabla del ${divisor} qué número da ${dividendo}: ${divisor} × ${cociente} = ${dividendo}.`
      : `Prueba con decenas: ${divisor} × 10 = ${divisor * 10}. Después busca cuánto falta hasta ${dividendo}: ${divisor} × ${cociente} = ${dividendo}.`,
    `Resultado: ${dividendo} : ${divisor} = ${cociente}. Compruébalo: ${cociente} × ${divisor} = ${dividendo}.`,
  ]
  const imagen = cociente <= 6 && divisor <= 5 ? `grupos:${divisor}x${cociente}` : undefined
  return tarea(`¿Cuánto es ${dividendo} : ${divisor}?`, cociente, pasos, { imagen, pista: `Piensa: ¿qué número multiplicado por ${divisor} da ${dividendo}?` })
}

// ---------- Fracciones ----------

const NOMBRES = { 2: 'medio', 3: 'tercio', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 8: 'octavo', 10: 'décimo' }

function fraccion(nivel) {
  if (nivel === 3) {
    const d = elegir([5, 6, 7, 8, 9, 10])
    const a = azar(1, d - 2)
    const b = azar(1, d - 1 - a)
    return tarea(`¿Cuánto es ${a}/${d} + ${b}/${d}?`, `${a + b}/${d}`, [
      `Las dos fracciones tienen el mismo denominador: ${d}.`,
      `Suma solo los numeradores: ${a} + ${b} = ${a + b}. El denominador se queda igual.`,
      `Resultado: ${a + b}/${d}.`,
    ], { imagen: d <= 8 ? `fraccion:${a + b}/${d}` : undefined, pista: 'Cuando el número de abajo es igual, solo se suman los de arriba.' })
  }
  const d = elegir([2, 3, 4, 5])
  const n = nivel === 1 ? 1 : azar(1, d - 1)
  const total = d * azar(2, nivel === 1 ? 5 : 10)
  const parte = total / d
  const pasos = [`Divide ${total} en ${d} partes iguales: ${total} : ${d} = ${parte}.`]
  if (n > 1) pasos.push(`Toma ${n} de esas partes: ${parte} × ${n} = ${parte * n}.`)
  pasos.push(`Resultado: ${n}/${d} de ${total} = ${parte * n}.`)
  const nombre = n > 1 ? `${n}/${d}` : d === 2 ? 'la mitad' : `un ${NOMBRES[d]}`
  return tarea(`¿Cuánto es ${nombre} de ${total}?`, parte * n, pasos, { imagen: `fraccion:${n}/${d}`, pista: `Primero reparte ${total} en ${d} partes iguales.` })
}

// ---------- Problemas con enunciado ----------

const PERSONAS = ['Lucía', 'Omar', 'Sara', 'Mateo', 'Aisha', 'Hugo', 'Valentina', 'Yusuf', 'Martina', 'Leo']
const COSAS = [
  { plural: 'caramelos', masculino: true },
  { plural: 'canicas', masculino: false },
  { plural: 'cromos', masculino: true },
  { plural: 'galletas', masculino: false },
  { plural: 'libros', masculino: true },
  { plural: 'pegatinas', masculino: false },
]

function problema(nivel) {
  const quien = elegir(PERSONAS)
  const cosa = elegir(COSAS)
  const cuantos = cosa.masculino ? '¿Cuántos' : '¿Cuántas'
  const max = [10, 50, 200][nivel - 1]
  const plantillas = [
    () => {
      const a = azar(2, max)
      const b = azar(2, max)
      return tarea(`${quien} tiene ${a} ${cosa.plural} y le regalan ${b} más. ${cuantos} ${cosa.plural} tiene ahora?`, a + b, [
        `Datos: tiene ${a} y le dan ${b}.`, `Le dan más, así que hay que sumar: ${a} + ${b}.`, `Resultado: ${a + b} ${cosa.plural}.`,
      ], { unidad: cosa.plural, pista: '¿Tiene más o menos que al principio?' })
    },
    () => {
      const a = azar(5, max)
      const b = azar(1, a - 1)
      return tarea(`En una caja hay ${a} ${cosa.plural}. ${quien} se lleva ${b}. ${cuantos} quedan en la caja?`, a - b, [
        `Datos: había ${a} y se lleva ${b}.`, `Se quitan, así que hay que restar: ${a} − ${b}.`, `Resultado: quedan ${a - b} ${cosa.plural}.`,
      ], { unidad: cosa.plural, pista: 'Si se lleva algunos, ¿quedan más o menos?' })
    },
    () => {
      const a = azar(2, nivel === 1 ? 5 : 9)
      const b = azar(2, nivel === 3 ? 25 : 10)
      return tarea(`${quien} tiene ${a} bolsas con ${b} ${cosa.plural} cada una. ${cuantos} ${cosa.plural} tiene en total?`, a * b, [
        `Datos: ${a} bolsas y ${b} en cada una.`, `Son grupos iguales, así que hay que multiplicar: ${a} × ${b}.`, `Resultado: ${a * b} ${cosa.plural}.`,
      ], { unidad: cosa.plural, imagen: a <= 5 && b <= 6 ? `grupos:${a}x${b}` : undefined, pista: 'Todas las bolsas tienen lo mismo: ¿qué operación junta grupos iguales?' })
    },
    () => {
      const amigos = azar(2, nivel === 1 ? 4 : 8)
      const cada = azar(2, nivel === 3 ? 20 : 8)
      return tarea(`${quien} reparte ${amigos * cada} ${cosa.plural} entre ${amigos} amigos a partes iguales. ${cuantos} recibe cada uno?`, cada, [
        `Datos: ${amigos * cada} ${cosa.plural} para ${amigos} amigos.`, `Repartir en partes iguales es dividir: ${amigos * cada} : ${amigos}.`, `Resultado: ${cada} ${cosa.plural} cada uno. Compruébalo: ${cada} × ${amigos} = ${amigos * cada}.`,
      ], { unidad: cosa.plural, pista: 'Repartir a partes iguales es dividir.' })
    },
    () => {
      const precio = azar(2, nivel === 1 ? 5 : 12)
      const unidades = azar(2, nivel === 1 ? 4 : 6)
      const billete = [10, 20, 50, 100].find((b) => b > precio * unidades)
      if (nivel === 1) {
        return tarea(`Un cuaderno cuesta ${precio} € y un estuche ${unidades} €. ¿Cuánto cuestan juntos?`, precio + unidades, [
          `Datos: ${precio} € y ${unidades} €.`, `Juntos es sumar: ${precio} + ${unidades}.`, `Resultado: ${precio + unidades} €.`,
        ], { unidad: '€' })
      }
      return tarea(`${quien} compra ${unidades} cuadernos de ${precio} € y paga con un billete de ${billete} €. ¿Cuánto le devuelven?`, billete - precio * unidades, [
        `Primero calcula lo que cuestan: ${unidades} × ${precio} = ${unidades * precio} €.`,
        `Después resta lo que pagó: ${billete} − ${unidades * precio} = ${billete - unidades * precio} €.`,
        `Resultado: le devuelven ${billete - unidades * precio} €.`,
      ], { unidad: '€', pista: 'Son dos pasos: primero lo que cuesta todo y luego la vuelta.' })
    },
  ]
  return elegir(plantillas)()
}

const GENERADORES = { sumas: suma, restas: resta, multiplicaciones: multiplicacion, divisiones: division, fracciones: fraccion, problemas: problema }

export function generarPractica(tema, nivel, cantidad = EJERCICIOS_POR_PRACTICA) {
  const tareas = []
  const vistas = new Set()
  for (let intento = 0; tareas.length < cantidad && intento < cantidad * 20; intento++) {
    const nueva = GENERADORES[tema](nivel)
    if (vistas.has(nueva.pregunta)) continue
    vistas.add(nueva.pregunta)
    tareas.push(nueva)
  }
  return tareas
}
