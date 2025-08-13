// DOM refs
const searchBox = document.querySelector(".search-box");
const searchButton = document.querySelector(".search-button");
const weatherDisplay = document.querySelector(".weather-display");
const forecastContainer = document.querySelector(".forecast-container");
const errorDisplay = document.querySelector(".error");
const unitToggle = document.querySelector(".unit-toggle");

// API (keep your API key safe)
const apiKey = "c76c1509bc3a5bb3cc2f530c39330736";
const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

// basic unit state (we keep Celsius as default for now)
let unit = "metric"; // metric = Celsius

async function getWeather(city) {
  // reset UI
  weatherDisplay.classList.remove("visible");
  forecastContainer.innerHTML = "";
  errorDisplay.style.display = "none";

  try {
    const currentResponse = await fetch(currentWeatherUrl + encodeURIComponent(city) + `&appid=${apiKey}`);
    if (!currentResponse.ok) throw new Error("City not found.");
    const currentData = await currentResponse.json();

    const forecastResponse = await fetch(forecastUrl + encodeURIComponent(city) + `&appid=${apiKey}`);
    if (!forecastResponse.ok) throw new Error("Forecast not available.");
    const forecastData = await forecastResponse.json();

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
  } catch (err) {
    errorDisplay.innerHTML = `<p>${err.message}</p>`;
    errorDisplay.style.display = "block";
  }
}

function displayCurrentWeather(data) {
  const { name } = data;
  const { icon, description } = data.weather[0];
  const { temp, humidity } = data.main;
  const { speed } = data.wind;

  const html = `
    <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}" class="main-weather-icon" />
    <div class="temp">${Math.round(temp)}°c</div>
    <div class="city">${name}</div>

    <div class="details">
      <div class="col">
        <img class="icon-small" src="https://cdn-icons-png.flaticon.com/512/728/728093.png" alt="humidity icon" />
        <div>
          <div class="humidity">${humidity}%</div>
          <p class="small">Humidity</p>
        </div>
      </div>

      <div class="col">
        <img class="icon-small" src="https://cdn-icons-png.flaticon.com/512/481/481476.png" alt="wind icon" />
        <div>
          <div class="wind">${(speed).toFixed(1)} km/h</div>
          <p class="small">Wind Speed</p>
        </div>
      </div>
    </div>
  `;

  weatherDisplay.innerHTML = html;
  // animate in
  setTimeout(() => weatherDisplay.classList.add("visible"), 30);
}

function displayForecast(data) {
  // pick roughly one forecast per day (12:00:00) — if api returns less, fallback gracefully
  const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
  // if less than 5 entries (some timezones), just take first 6 unique days
  let forecasts = daily;
  if (forecasts.length < 5) {
    // collect by date key
    const byDay = {};
    for (const item of data.list) {
      const d = new Date(item.dt * 1000);
      const key = d.toISOString().split("T")[0];
      if (!byDay[key]) byDay[key] = item;
    }
    forecasts = Object.values(byDay).slice(0, 6);
  } else {
    forecasts = forecasts.slice(0, 6); // show up to 6 days
  }

  const html = forecasts.map(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleString('en-US', { weekday: 'short' });
    const icon = day.weather[0].icon;
    const temp = Math.round(day.main.temp);
    return `
      <div class="forecast-day">
        <div class="day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" />
        <div class="temp-range">${temp}°c</div>
      </div>
    `;
  }).join("");

  forecastContainer.innerHTML = html;
}

// events
searchButton.addEventListener("click", () => {
  const city = searchBox.value.trim();
  if (city) getWeather(city);
});
searchBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = searchBox.value.trim();
    if (city) getWeather(city);
  }
});

// basic toggle placeholder (C <-> F)
// (keeps UI toggle but doesn't re-fetch with imperial units; quick demo)
unitToggle.addEventListener("click", () => {
  if (unit === "metric") {
    unit = "imperial";
    unitToggle.textContent = "°F";
    // You can implement re-fetching with units=imperial and update displays later
  } else {
    unit = "metric";
    unitToggle.textContent = "°C";
  }
});

// load a default city on load
window.addEventListener("load", () => {
  getWeather("New York");
});
