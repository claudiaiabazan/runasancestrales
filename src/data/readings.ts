export interface ReadingPosition {
  name: string;
  x: number;
  y: number;
  meaning: string;
}

export interface ReadingType {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  runesRequired: number;
  shape: "horizontal" | "cross" | "tree" | "double_vertical";
  positions: ReadingPosition[];
}

export const READINGS: ReadingType[] = [
  {
    id: "tres-nornas",
    name: "Tres Nornas",
    description: "Lectura de pasado, presente y futuro.",
    longDescription:
      "Las tres tejedoras del destino —Urd, Verdandi y Skuld— te muestran el hilo del tiempo: lo que fue, lo que es y lo que vendrá.",
    runesRequired: 3,
    shape: "horizontal",
    positions: [
      { name: "Pasado", x: 3, y: 1, meaning: "La raíz de la situación, lo ya tejido por Urd." },
      { name: "Presente", x: 2, y: 1, meaning: "La fuerza que actúa ahora, el hilo de Verdandi." },
      { name: "Futuro", x: 1, y: 1, meaning: "Lo que se aproxima si sigues este sendero, el telar de Skuld." },
    ],
  },
  {
    id: "cruz-celta",
    name: "Cruz Celta",
    description: "Análisis profundo de una situación.",
    longDescription:
      "Una tirada de cinco runas que ilumina las fuerzas que rodean una situación: pasado, esencia, futuro, lo que está por encima y lo que descansa por debajo.",
    runesRequired: 6,
    shape: "cross",
    positions: [
      { name: "Pasado", x: 3, y: 3, meaning: "La raíz de la situación: lo que dejó huella y aún influye." },
      { name: "Presente", x: 2, y: 3, meaning: "El corazón del asunto, la energía dominante en este momento." },
      { name: "Futuro", x: 1, y: 3, meaning: "Hacia dónde se inclina la balanza si sigues este sendero." },
      { name: "Raíz", x: 2, y: 4, meaning: "Lo subconsciente, las raíces ocultas que sostienen todo lo demás." },
      { name: "Superior", x: 2, y: 2, meaning: "Lo consciente, aquello que ya percibes y guía tu mirada." },
      { name: "Cielo", x: 2, y: 1, meaning: "Lo que el cielo revela: la inspiración y el destino que desciende sobre ti." },
    ],
  },
  {
    id: "arbol-de-la-vida",
    name: "Árbol de la Vida",
    description: "Exploración profunda del ser y crecimiento espiritual.",
    longDescription:
      "Inspirada en Yggdrasil, esta tirada de siete runas recorre tu árbol interior: desde la raíz hasta el fruto que está por madurar.",
    runesRequired: 7,
    shape: "tree",
    positions: [
      { name: "Raíz", x: 2, y: 4, meaning: "Tu fundamento, lo ancestral." },
      { name: "Tronco", x: 2, y: 3, meaning: "Lo que sostiene tu vida actual." },
      { name: "Rama Izquierda", x: 1, y: 2, meaning: "Lo recibido, lo femenino, la intuición." },
      { name: "Rama Derecha", x: 3, y: 2, meaning: "Lo entregado, lo masculino, la acción." },
      { name: "Copa Izquierda", x: 1, y: 1, meaning: "Sueños y aspiraciones internas." },
      { name: "Copa Derecha", x: 3, y: 1, meaning: "Lo que el mundo te devuelve." },
      { name: "Fruto", x: 2, y: 0, meaning: "La cosecha espiritual del momento." },
    ],
  },
  {
    id: "nueve-runas",
    name: "Las Nueve Runas",
    description: "Visión completa: cuerpo, mente y espíritu en el tiempo.",
    longDescription:
      "El Castillo de las Nueve Runas, sagrado para los antiguos nórdicos. Tres filas de tres runas que recorren el espíritu, el alma y el cuerpo a través del pasado, el presente y el futuro.",
    runesRequired: 9,
    shape: "tree",
    positions: [
      { name: "Pasado · Espíritu", x: 3, y: 1, meaning: "La herencia espiritual que tu alma trae desde el ayer, la inspiración recibida en otros tiempos." },
      { name: "Pasado · Mente", x: 2, y: 1, meaning: "Pensamientos y decisiones del ayer que marcaron el camino hasta aquí." },
      { name: "Pasado · Cuerpo", x: 1, y: 1, meaning: "Los hechos y acciones concretas del pasado, lo material ya tejido." },
      { name: "Presente · Espíritu", x: 3, y: 2, meaning: "La chispa divina que arde en ti ahora, lo que el cielo te susurra." },
      { name: "Presente · Mente", x: 2, y: 2, meaning: "Aquello que ocupa tu mente y tu corazón en este instante." },
      { name: "Presente · Cuerpo", x: 1, y: 2, meaning: "La realidad concreta que vives hoy, lo que toca tu día a día." },
      { name: "Futuro · Espíritu", x: 3, y: 3, meaning: "El destino espiritual que se revela en lo alto, aquello que viene desde los dioses." },
      { name: "Futuro · Mente", x: 2, y: 3, meaning: "Hacia dónde se dirigen tus pensamientos y emociones." },
      { name: "Futuro · Cuerpo", x: 1, y: 3, meaning: "El resultado tangible, la cosecha que se aproxima." },
    ],
  },
];

export const getReading = (id: string) => READINGS.find((r) => r.id === id);
