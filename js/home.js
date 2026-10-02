const settingsName = typeof SETTINGS !== "undefined" ? SETTINGS.name : "";
const name = String(settingsName || "Nombre").trim() || "Nombre";
const text = `Hola, ${name}!`;
const greeting = document.querySelector("#greeting");

greeting.setAttribute("aria-label", text);

[...text].forEach((char, index) => {
  const span = document.createElement("span");
  span.textContent = char === " " ? "\u00A0" : char;
  span.setAttribute("aria-hidden", "true");
  span.style.animationDelay = `${0.05 + index * 0.055}s`;
  greeting.appendChild(span);
});
