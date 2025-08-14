// ===== Config =====
const API_KEY = "73cca61287abbce27976f056c3edcbb6"; // <- replace me
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// ===== DOM =====
const input = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const unitBtn = document.querySelector(".unit-btn");
const currentEl = document.querySelector(".current");
const forecastEl = document.querySelector(".forecast");
const errorEl = document.querySelector(".error");

// units: "metric" (°C, m/s) or "imperial" (°F, mph)
let units = "metric";

function fmtTemp(n) {
  return `${Math.round(n)}${units === "metric" ? "°c" : "°f"}`;
}
function fmtWind(speed) {
  // API returns m/s (metric) or miles/hour (imperial)
  if (units === "metric") {
    const kmh = speed * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }
  return `${speed.toFixed(1)} mph`;
}

async function getWeather(city) {
  errorEl.style.display = "none";
  currentEl.classList.remove("visible");
  forecastEl.innerHTML = "";

  try {
    // CURRENT
    const currentRes = await fetch(
      `${CURRENT_URL}?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`
    );
    if (!currentRes.ok) throw new Error("City not found.");
    const current = await currentRes.json();

    // FORECAST (5 days / 3-hour steps)
    const forecastRes = await fetch(
      `${FORECAST_URL}?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`
    );
    if (!forecastRes.ok) throw new Error("Forecast not available.");
    const forecast = await forecastRes.json();

    renderCurrent(current);
    renderForecastToSunday(forecast);
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.style.display = "block";
  }
}

function renderCurrent(data) {
  const icon = data.weather?.[0]?.icon ?? "01d";
  const desc = data.weather?.[0]?.description ?? "—";
  const temp = data.main?.temp ?? 0;
  const humidity = data.main?.humidity ?? 0;
  const wind = data.wind?.speed ?? 0;
  const name = data.name ?? "—";

  currentEl.innerHTML = `
    <img class="icon" src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${desc}">
    <div class="temp">${fmtTemp(temp)}</div>
    <div class="city">${name}</div>
    <div class="meta">
      <div class="pair">
        <img src="https://cdn-icons-png.flaticon.com/512/728/728093.png" alt="humidity" width="34" height="34">
        <div>
          <div style="font-weight:600">${humidity}%</div>
          <div class="label">Humidity</div>
        </div>
      </div>
      <div class="pair">
        <img src="https://cdn-icons-png.flaticon.com/512/481/481476.png" alt="wind" width="34" height="34">
        <div>
          <div style="font-weight:600">${fmtWind(wind)}</div>
          <div class="label">Wind Speed</div>
        </div>
      </div>
    </div>
  `;
  requestAnimationFrame(() => currentEl.classList.add("visible"));
}

/**
 * Builds daily forecast cards from TODAY → upcoming SUNDAY (inclusive).
 * Uses city.timezone to localize each 3-hour step, then aggregates per local day.
 * Shows high/low (or single temp if not enough points), and prefers a midday icon.
 */
function renderForecastToSunday(forecast) {
  const tz = forecast.city?.timezone ?? 0; // seconds offset from UTC
  const nowUtc = Date.now(); // ms
  const localNow = new Date(nowUtc + tz * 1000);

  // compute end-of-range Sunday (0=Sun..6=Sat)
  const dow = localNow.getUTCDay(); // using UTC day of the shifted "local" time
  const daysUntilSun = (7 - dow) % 7; // if today is Sunday => 0
  const end = new Date(localNow);
  end.setUTCDate(end.getUTCDate() + daysUntilSun);
  end.setUTCHours(23, 59, 59, 999);

  // group forecast items by LOCAL date (YYYY-MM-DD)
  const byDay = new Map();
  for (const item of forecast.list) {
    const local = new Date(item.dt * 1000 + tz * 1000);
    // ignore anything before today (shouldn't happen but just in case)
    if (local < stripTime(localNow)) continue;
    if (local > end) continue;

    const key = local.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push({ local, item });
  }

  // sort keys ascending by date
  const keys = Array.from(byDay.keys()).sort();

  // Build cards
  const cards = keys.map(key => {
    const entries = byDay.get(key);

    // choose icon closest to 12:00 local
    let chosen = entries[0];
    const targetH = 12;
    for (const e of entries) {
      if (Math.abs(e.local.getUTCHours() - targetH) < Math.abs(chosen.local.getUTCHours() - targetH)) {
        chosen = e;
      }
    }
    const icon = chosen.item.weather?.[0]?.icon ?? "01d";

    // compute min/max
    let min = +Infinity, max = -Infinity;
    for (const e of entries) {
      const t = e.item.main?.temp;
      if (typeof t === "number") {
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    if (!isFinite(min) || !isFinite(max)) {
      const t = chosen.item.main?.temp ?? 0;
      min = max = t;
    }

    const d = entries[0].local;
    const dayName = d.toLocaleString("en-US", { weekday: "short" });

    return `
      <div class="card-day">
        <div class="day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
        <div class="range">${fmtTemp(min)} / ${fmtTemp(max)}</div>
      </div>
    `;
  }).join("");

  forecastEl.innerHTML = cards || `<div style="opacity:.8">No upcoming entries up to Sunday.</div>`;
}

function stripTime(d) {
  const c = new Date(d);
  c.setUTCHours(0,0,0,0);
  return c;
}

// ===== Events =====
searchBtn.addEventListener("click", () => {
  const q = input.value.trim();
  if (q) getWeather(q);
});
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const q = input.value.trim();
    if (q) getWeather(q);
  }
});

// Simple unit toggle + refresh current query if present
unitBtn.addEventListener("click", () => {
  units = units === "metric" ? "imperial" : "metric";
  unitBtn.textContent = units === "metric" ? "°C" : "°F";
  const q = input.value.trim();
  if (q) getWeather(q);
});

// Load a default city
window.addEventListener("load", () => getWeather("New York"));

