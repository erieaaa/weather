const searchBox = document.querySelector(".search-box");
const searchButton = document.querySelector(".search-button");
const weatherDisplay = document.querySelector(".weather-display");
const forecastContainer = document.querySelector(".forecast-container");
const errorDisplay = document.querySelector(".error");

const apiKey = "c76c1509bc3a5bb3cc2f530c39330736";
const currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

async function getWeather(city) {
    weatherDisplay.classList.remove("visible");
    forecastContainer.classList.remove("visible");
    errorDisplay.style.display = "none";

    try {
        const currentResponse = await fetch(currentWeatherUrl + city + `&appid=${apiKey}`);
        if (!currentResponse.ok) throw new Error('City not found.');
        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(forecastUrl + city + `&appid=${apiKey}`);
        if (!forecastResponse.ok) throw new Error('Forecast not available.');
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);

    } catch (error) {
        errorDisplay.innerHTML = `<p>${error.message}</p>`;
        errorDisplay.style.display = "block";
    }
}

function displayCurrentWeather(data) {
    const { name } = data;
    const { icon, description } = data.weather[0];
    const { temp, humidity } = data.main;
    const { speed } = data.wind;

    const weatherHTML = `
        <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${description}" class="main-weather-icon">
        <h1 class="temp">${Math.round(temp)}°c</h1>
        <h2 class="city">${name}</h2>
        <div class="details">
            <div class="col">
                <img src="https://cdn-icons-png.flaticon.com/512/728/728093.png" alt="humidity icon">
                <div>
                    <p class="humidity">${humidity}%</p>
                    <p>Humidity</p>
                </div>
            </div>
            <div class="col">
                <img src="https://cdn-icons-png.flaticon.com/512/481/481476.png" alt="wind icon">
                <div>
                    <p class="wind">${speed.toFixed(1)} km/h</p>
                    <p>Wind Speed</p>
                </div>
            </div>
        </div>
    `;
    weatherDisplay.innerHTML = weatherHTML;
    weatherDisplay.classList.add("visible");
}

function displayForecast(data) {
    let forecastHTML = '';
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleString('en-US', { weekday: 'short' });
        const icon = day.weather[0].icon;
        const temp = Math.round(day.main.temp);

        forecastHTML += `
            <div class="forecast-day">
                <p class="day">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon">
                <p class="temp-range">${temp}°c</p>
            </div>
        `;
    });

    forecastContainer.innerHTML = forecastHTML;
    forecastContainer.classList.add("visible");
}

searchButton.addEventListener("click", () => {
    const city = searchBox.value.trim();
    if (city) getWeather(city);
});

searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const city = searchBox.value.trim();
        if (city) getWeather(city);
    }
});

window.addEventListener('load', () => {
    getWeather("New York");
});

