export const EXERCISE_VIDEO_LINKS = {
  // Cole a URL do vídeo entre as aspas. Os nomes já correspondem ao catálogo.
  "Abdominal bicicleta": "",
  "Abdominal canivete": "",
  Afundo: "",
  "Agachamento com halteres": "",
  "Agachamento goblet": "",
  Avanço: "",
  "Agachamento + salto": "",
  "Agachamento búlgaro": "",
  "Agachamento com barra": "",
  "Agachamento frontal": "",
  "Agachamento guiado": "",
  "Agachamento livre": "",
  "Agachamento no Smith": "",
  "Agachamento sumô": "",
  "Barra fixa": "",
  "Barra fixa assistida": "",
  "Bicicleta ergométrica": "",
  "Cadeira abdutora": "",
  "Cadeira extensora": "",
  "Cadeira flexora": "",
  "Caminhada inclinada na esteira": "",
  "Corrida leve": "",
  "Crucifixo com halteres": "",
  Crossover: "",
  Burpee: "",
  "Corrida estacionária": "",
  "Corda naval": "",
  "Dead bug": "",
  "Desenvolvimento Arnold": "",
  "Desenvolvimento militar": "",
  "Desenvolvimento no Smith": "",
  Desenvolvimento: "",
  "Desenvolvimento com halteres": "",
  "Desenvolvimento com mochila": "",
  "Elevação pélvica": "",
  "Elevação de panturrilha em pé": "",
  "Elevação de panturrilha sentada": "",
  "Elevação lateral": "",
  Elíptico: "",
  Escada: "",
  "Escalador (mountain climber)": "",
  Esteira: "",
  "Face pull": "",
  "Flexão com pegada aberta": "",
  "Flexão de braço": "",
  "Flexão diamante": "",
  "Flexão inclinada na parede": "",
  "Kettlebell swing": "",
  "Leg press": "",
  "Levantamento terra": "",
  "Levantamento terra romeno": "",
  "Mesa flexora": "",
  Paralelas: "",
  "Passada andando": "",
  "Peck deck": "",
  Pulldown: "",
  "Pullover na máquina": "",
  "Pular corda": "",
  "Puxada neutra": "",
  Prancha: "",
  "Prancha lateral": "",
  Polichinelos: "",
  "Polichinelos cruzados": "",
  "Puxada aberta": "",
  "Puxada na frente": "",
  "Remada baixa": "",
  "Remada cavalinho": "",
  "Remada curvada": "",
  "Remada curvada com mochila": "",
  "Remada articulada": "",
  "Remada invertida na mesa": "",
  "Remada alta": "",
  "Remada unilateral": "",
  "Remo ergométrico": "",
  "Rosca alternada": "",
  "Rosca direta": "",
  "Rosca direta com mochila": "",
  "Rosca martelo": "",
  "Rosca martelo com halteres": "",
  "Roda abdominal": "",
  "Russian twist": "",
  "Serrote com halter": "",
  "Step-up no banco": "",
  Stiff: "",
  "Supino declinado": "",
  "Supino inclinado": "",
  "Supino inclinado com halteres": "",
  "Supino reto com halteres": "",
  "Supino reto na máquina": "",
  "Supino reto": "",
  "Tríceps banco": "",
  "Tríceps corda": "",
  "Tríceps testa": "",
  "Tríceps pulley": "",
  "Hack squat": "",
};

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getExerciseVideoUrl(exercise) {
  if (exercise && typeof exercise === "object" && exercise.videoUrl)
    return exercise.videoUrl;

  const rawName =
    typeof exercise === "object" ? exercise?.name : String(exercise || "");
  const name = String(rawName)
    .replace(/\s*[–—-]\s*\d+\s*x\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*.*)?$/i, "")
    .replace(/\s*[–—-]\s*\d+\s*(?:reps?|s|segundos?|min(?:utos?)?)\b.*$/i, "")
    .trim();
  const key = normalize(name);
  const entry = Object.entries(EXERCISE_VIDEO_LINKS).find(
    ([exerciseName]) => normalize(exerciseName) === key,
  );
  return entry?.[1] || "";
}

export function getYouTubeEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
      else if (/^\/(embed|shorts)\//.test(url.pathname))
        videoId = url.pathname.split("/")[2] || "";
    }

    if (!/^[\w-]{11}$/.test(videoId)) return "";
    return `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1`;
  } catch {
    return "";
  }
}
