// ===== Config =====
const API_KEY = "c76c1509bc3a5bb3cc2f530c39330736"; // <- replace me
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
 * Uses
