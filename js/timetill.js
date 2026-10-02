const KEY = "lorenn-timetill";
const DAY_LIMIT = 4000;

const input = document.querySelector("#target");
const hint = document.querySelector("#hint");
const remain = document.querySelector("#remain");
const track = document.querySelector("#track");
const fill = document.querySelector("#fill");

let state = load();

if (state?.time) {
  input.value = state.time;
}

input.addEventListener("input", () => {
  const value = normalizeTime(input.value);
  if (!value) {
    state = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    render(Date.now());
    return;
  }

  if (state?.time === value) return;

  const now = Date.now();
  state = {
    time: value,
    startedAt: now,
    endsAt: nextOccurrence(value, now),
  };
  save(state);
  render(now);
});

function normalizeTime(value) {
  const match = /^(\d{2}):(\d{2})/.exec(value || "");
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${match[1]}:${match[2]}`;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    const time = normalizeTime(raw?.time);
    if (!time) return null;
    return { ...raw, time };
  } catch {
    return null;
  }
}

function save(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

function nextOccurrence(timeValue, fromMs) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const target = new Date(fromMs);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= fromMs) {
    target.setDate(target.getDate() + 1);
    target.setHours(hours, minutes, 0, 0);
  }
  return target.getTime();
}

function ensureWindow(current, now) {
  if (!Number.isFinite(current.endsAt) || !Number.isFinite(current.startedAt)) {
    return {
      time: current.time,
      startedAt: now,
      endsAt: nextOccurrence(current.time, now),
    };
  }

  let { time, startedAt, endsAt } = current;
  let guard = 0;

  while (now >= endsAt && guard < DAY_LIMIT) {
    const previous = endsAt;
    endsAt = nextOccurrence(time, endsAt);
    if (endsAt <= previous) break;
    startedAt = previous;
    guard += 1;
  }

  return { time, startedAt, endsAt };
}

function formatDuration(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function render(now) {
  if (!state?.time) {
    hint.hidden = true;
    remain.textContent = "—";
    remain.classList.add("is-idle");
    fill.style.transform = "scaleX(0)";
    track.setAttribute("aria-valuenow", "0");
    document.title = "TimeTill";
    return;
  }

  const synced = ensureWindow(state, now);
  if (synced.endsAt !== state.endsAt || synced.startedAt !== state.startedAt) {
    state = synced;
    save(state);
  }

  const span = Math.max(1, state.endsAt - state.startedAt);
  const progress = Math.min(1, Math.max(0, (now - state.startedAt) / span));
  const label = formatDuration(state.endsAt - now);

  hint.hidden = false;
  remain.classList.remove("is-idle");
  remain.textContent = label;
  fill.style.transform = `scaleX(${progress})`;
  track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
  document.title = `${label} · TimeTill`;
}

function loop() {
  const now = Date.now();
  render(now);
  window.setTimeout(loop, 1000 - (now % 1000));
}

loop();
