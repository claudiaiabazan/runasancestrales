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
      { name: "Cielo", x: 2, y: 1, meaning: "Lo que el cielo revela: la inspiración y el destino que desciende sobre ti." },
      { name: "Superior", x: 2, y: 2, meaning: "Lo consciente, aquello que ya percibes y guía tu mirada." },
      { name: "Pasado", x: 1, y: 3, meaning: "La raíz de la situación: lo que dejó huella y aún influye." },
      { name: "Centro", x: 2, y: 3, meaning: "El corazón del asunto, la energía dominante en este momento." },
      { name: "Futuro", x: 3, y: 3, meaning: "Hacia dónde se inclina la balanza si sigues este sendero." },
      { name: "Raíz", x: 2, y: 4, meaning: "Lo subconsciente, las raíces ocultas que sostienen todo lo demás." },
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
    id: "pareja",
    name: "Pareja",
    description: "Conexión emocional y dinámica entre dos personas.",
    longDescription:
      "Seis runas que reflejan la mente, el corazón y el futuro de dos almas que se encuentran en el mismo camino.",
    runesRequired: 6,
    shape: "double_vertical",
    positions: [
      { name: "Persona A · Mente", x: 1, y: 1, meaning: "Lo que piensa la primera persona." },
      { name: "Persona A · Corazón", x: 1, y: 2, meaning: "Lo que siente la primera persona." },
      { name: "Persona A · Futuro", x: 1, y: 3, meaning: "Hacia dónde tiende la primera persona." },
      { name: "Persona B · Mente", x: 3, y: 1, meaning: "Lo que piensa la segunda persona." },
      { name: "Persona B · Corazón", x: 3, y: 2, meaning: "Lo que siente la segunda persona." },
      { name: "Persona B · Futuro", x: 3, y: 3, meaning: "Hacia dónde tiende la segunda persona." },
    ],
  },
];

export const getReading = (id: string) => READINGS.find((r) => r.id === id);
