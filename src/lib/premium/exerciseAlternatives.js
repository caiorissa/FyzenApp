export const exerciseAlternatives = {
  // ========================
  // GRUPO: PEITO
  // ========================
  "flexão de braço": [
    "flexão inclinada",
    "flexão declinada",
    "flexão diamante",
    "flexão militar",
    "flexão com joelho apoiado",
    "supino reto com halteres",
    "supino reto na máquina",
  ],

  "supino reto": [
    "supino inclinado",
    "supino declinado",
    "crucifixo com halteres",
    "flexão de braço",
    "crossover",
    "peck-deck",
  ],

  "supino inclinado": [
    "supino reto",
    "supino declinado",
    "crucifixo inclinado",
    "flexão inclinada",
    "crossover alto",
  ],

  crucifixo: [
    "crucifixo inclinado",
    "supino reto",
    "supino inclinado",
    "crossover",
    "flexão aberta",
  ],

  // GRUPO: COSTAS
  "remada baixa": [
    "remada curvada",
    "remada unilateral",
    "puxada frontal",
    "puxada neutra",
    "barra fixa (assistida)",
    "serrote com halter",
  ],

  "remada curvada": [
    "remada baixa",
    "remada unilateral",
    "serrote com halter",
    "puxada alta",
  ],

  "puxada frontal": [
    "puxada neutra",
    "barra fixa assistida",
    "remada baixa",
    "pull-over na máquina",
  ],

  "barra fixa": [
    "barra fixa assistida",
    "puxada frontal",
    "remada baixa",
    "serrote com halter",
  ],

  // GRUPO: PERNAS & GLÚTEO
  agachamento: [
    "agachamento sumô",
    "agachamento búlgaro",
    "leg press",
    "cadeira extensora",
    "avanço",
    "afundo",
  ],

  "agachamento sumô": [
    "agachamento tradicional",
    "agachamento búlgaro",
    "levantamento terra romeno",
    "afundo com halter",
  ],

  "agachamento búlgaro": [
    "agachamento sumô",
    "avanço",
    "passada",
    "afundo",
    "stiff",
  ],

  "leg press": [
    "agachamento livre",
    "agachamento no smith",
    "cadeira extensora",
    "cadeira flexora",
  ],

  "cadeira extensora": [
    "agachamento",
    "leg press",
    "avanço",
    "passada",
    "agachamento sumô",
  ],

  "cadeira flexora": [
    "stiff",
    "levantamento terra romeno",
    "mesa flexora",
    "agachamento sumô",
  ],

  // GRUPO: OMBROS
  "desenvolvimento com halteres": [
    "elevação lateral",
    "elevação frontal",
    "desenvolvimento militar",
    "remada alta",
  ],

  "elevação lateral": [
    "elevação frontal",
    "desenvolvimento com halteres",
    "remada alta",
  ],

  "elevação frontal": ["elevação lateral", "desenvolvimento", "remada alta"],

  "remada alta": ["desenvolvimento", "elevação lateral", "elevação frontal"],

  // GRUPO: BRAÇOS (BÍCEPS / TRÍCEPS)
  "rosca direta": [
    "rosca alternada",
    "rosca concentrada",
    "rosca martelo",
    "barra fixa supinada",
  ],

  "rosca alternada": ["rosca direta", "rosca martelo", "rosca scott"],

  "rosca martelo": ["rosca alternada", "rosca direta", "barra fixa supinada"],

  "tríceps corda": [
    "tríceps testa",
    "tríceps mergulho",
    "tríceps banco",
    "tríceps pulley",
  ],

  "tríceps testa": ["tríceps corda", "tríceps mergulho", "tríceps banco"],

  // GRUPO: ABDOMINAL / CORE
  prancha: [
    "prancha lateral",
    "prancha com elevação de perna",
    "prancha alta",
    "abdominal infra",
  ],

  "abdominal infra": [
    "elevação de pernas",
    "abdominal bicicleta",
    "abdominal reto",
    "prancha",
  ],

  "abdominal bicicleta": [
    "abdominal oblíquo",
    "abdominal infra",
    "abdominal canivete",
  ],

  "abdominal lombar (superman)": [
    "hiperextensão",
    "prancha lateral",
    "prancha",
  ],

  // GRUPO: CARDIO
  "corrida estacionária": [
    "corrida leve",
    "polichinelos",
    "salto no step",
    "bike ergométrica",
  ],

  polichinelos: ["corrida estacionária", "salto no step", "corda"],

  "pular corda": ["corrida rápida", "salto no step", "polichinelos"],

  burpee: ["burpee com salto", "polichinelos", "corrida estacionária intensa"],
};

export function getAlternatives(exercicio) {
  const key = exercicio.toLowerCase().trim();
  return exerciseAlternatives[key] || [];
}
