import { runCleanup } from "../services/cleanupService";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY = 60_000;

let running = false;

async function runSafely() {
  if (running) return; // never let two runs overlap
  running = true;

  try {
    const result = await runCleanup();
    const changed = Object.values(result).some((count) => count > 0);
    if (changed) console.log("Cleanup finished:", result);
  } catch (error) {
    // A failed cleanup must never crash the server. It simply tries again next time.
    console.error("Cleanup failed:", error);
  } finally {
    running = false;
  }
}

export function startCleanupJob() {
  const first = setTimeout(runSafely, STARTUP_DELAY);
  const repeat = setInterval(runSafely, SIX_HOURS);

  // Don't let these timers keep the process alive when the server is shutting down.
  first.unref();
  repeat.unref();
}