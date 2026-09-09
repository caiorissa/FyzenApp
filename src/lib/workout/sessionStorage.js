const PREFIX = "fyzen:workout-session:";

function key(uid) {
  return `${PREFIX}${uid}`;
}

export function saveActiveSession(uid, session) {
  if (!uid || !session || typeof window === "undefined") return;
  localStorage.setItem(
    key(uid),
    JSON.stringify({ version: 2, savedAt: Date.now(), session }),
  );
}

export function loadActiveSession(uid) {
  if (!uid || typeof window === "undefined") return null;
  try {
    return (
      JSON.parse(localStorage.getItem(key(uid)) || "null")?.session || null
    );
  } catch {
    return null;
  }
}

export function clearActiveSession(uid) {
  if (uid && typeof window !== "undefined") localStorage.removeItem(key(uid));
}
