const KEY = "lorenn-pomodoro";
const DURATION = 25 * 60;

const digits = document.querySelector("#digits");
const track = document.querySelector("#track");
const fill = document.querySelector("#fill");
const toggle = document.querySelector("#toggle");
const resetButton = document.querySelector("#reset");

let remaining = DURATION;
let endsAt = null;
let timer = null;

restore();
render();

toggle.addEventListener("click", () => {
  if (endsAt) {
    remaining = secondsLeft();
    stop();
    save();
    render();
    return;
  }

  if (remaining <= 0) remaining = DURATION;
  endsAt = Date.now() + remaining * 1000;
  timer = window.setInterval(tick, 200);
  save();
  render();
});

resetButton.addEventListener("click", () => {
  stop();
  remaining = DURATION;
  save();
  render();
});

function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw) return;

    if (raw.endsAt) {
      const left = Math.ceil((raw.endsAt - Date.now()) / 1000);
      if (left <= 0) {
        remaining = 0;
        endsAt = null;
        return;
      }
      endsAt = raw.endsAt;
      remaining = Math.min(DURATION, left);
      timer = window.setInterval(tick, 200);
      return;
    }

    if (Number.isFinite(raw.remaining)) {
      remaining = Math.min(DURATION, Math.max(0, raw.remaining));
    }
  } catch {
    /* storage unavailable */
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ endsAt, remaining }));
  } catch {
    /* storage unavailable */
  }
}

function stop() {
  endsAt = null;
  window.clearInterval(timer);
  timer = null;
}

function secondsLeft() {
  if (!endsAt) return remaining;
  return Math.max(0, Math.min(DURATION, Math.ceil((endsAt - Date.now()) / 1000)));
}

function tick() {
  if (!endsAt) return;
  const left = Math.ceil((endsAt - Date.now()) / 1000);
  if (left <= 0) {
    remaining = 0;
    stop();
    save();
  } else {
    remaining = Math.min(DURATION, left);
  }
  render();
}

function render() {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = 1 - remaining / DURATION;

  digits.textContent = label;
  fill.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  track.setAttribute("aria-valuenow", String(Math.round(Math.min(1, Math.max(0, progress)) * 100)));
  toggle.textContent = endsAt ? "Pausar" : "Iniciar";
  document.title = `${label} · Pomodoro`;
}
