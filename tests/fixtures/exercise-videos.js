const testVideoByExercise = new Map([
  ["agachamento livre", "https://www.youtube.com/watch?v=M7lc1UVf-VE"],
]);

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function getExerciseVideoUrl(exercise) {
  const name = typeof exercise === "object" ? exercise?.name : exercise;
  const base = String(name || "").replace(/\s*[–—-]\s*\d+\s*x\s*\d+.*$/i, "");
  return testVideoByExercise.get(normalize(base)) || "";
}

export function getYouTubeEmbedUrl(videoUrl) {
  try {
    const videoId = new URL(videoUrl).searchParams.get("v");
    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1`
      : "";
  } catch {
    return "";
  }
}
