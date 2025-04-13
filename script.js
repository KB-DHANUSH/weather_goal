let lat;
let lon;
let url;
navigator.geolocation.getCurrentPosition(
    (position) => {
      lat = position.coords.latitude;
      lon = position.coords.longitude;

      let apiKey = "4c7e9fb2762e4f7c9d1130502253103";
      url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes&days=5`;
      fUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5`;

    },
    (error) => {
      console.error("Error getting location: ", error);
    }
);

let update=document.getElementById('update');
update.addEventListener('click',()=>{
    getWeather();
})

let wData;
async function getWeather() {
    try{
        const response=await fetch(url);
        const fResponce=await fetch(fUrl);
        wData=await response.json();
        fData=await fResponce.json();
        console.log(wData)
        console.log(fData)
        updateValues()
        updateForecast(fData)
        updateWeatherAnimation(wData.current.condition.text)
        updateGreetingAndSuggestion();
    }
    catch(error){
        console.log(error);
    }
}

function updateValues() {
    document.getElementById('latitude').innerText = `Latitude: ${lat}°N`;
    document.getElementById('longitude').innerText = `Longitude: ${lon}°E`;
    document.getElementById('address').innerText = `${wData.location.name}, ${wData.location.region}, ${wData.location.country}`;

    // Update temperature
    document.querySelector('.temperature-details p').innerText = `${wData.current.temp_c}°C`;
    document.querySelector('.temperature-details span').innerText = `Feels like: ${wData.current.feelslike_c}°C`;

    // Update wind information
    document.querySelector('.wind-details p').innerText = `${wData.current.wind_kph} km/h`;
    document.querySelector('.wind-details span').innerText = `From ${wData.current.wind_dir}`;

    // Update air quality
    const airQualityIndex = wData.current.air_quality['us-epa-index'];
    const airQualityText = airQualityIndex === 1 ? 'Good' : airQualityIndex === 2 ? 'Moderate' : airQualityIndex === 3 ? 'Unhealthy for Sensitive Groups' : airQualityIndex === 4 ? 'Unhealthy' : airQualityIndex === 5 ? 'Very Unhealthy' : 'Hazardous';
    document.querySelector('.aqi-details p').innerText = `${airQualityIndex}`;
    document.querySelector('.aqi-details span').innerText = `${airQualityText}`;

    // Update UV index
    document.querySelector('.uv-details p').innerText = `${wData.current.uv}`;
    document.querySelector('.uv-details span').innerText = `${wData.current.uv > 5 ? 'High' : 'Moderate'}`;
}

function updateForecast(fData) {
    // Get all forecast day elements
    const forecastDays = document.querySelectorAll('.forecast-day');
    
    // Make sure we have forecast data
    if (fData && fData.forecast && fData.forecast.forecastday) {
        // Loop through each forecast day (starting from tomorrow - index 1)
        for (let i = 0; i < forecastDays.length; i++) {
            // Make sure we don't exceed the available forecast data
            if (i < fData.forecast.forecastday.length) {
                const dayData = fData.forecast.forecastday[i];
                
                // Get day name (Mon, Tue, etc.)
                const date = new Date(dayData.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                // Update day name
                forecastDays[i].querySelector('span:first-child').innerText = dayName;
                
                // Update temperature (max temp)
                forecastDays[i].querySelector('span:nth-child(2)').innerText = `${Math.round(dayData.day.maxtemp_c)}°`;
                
                // Update weather icon based on condition code
                const weatherIcon = forecastDays[i].querySelector('.weather-icon i');
                
                // Remove all existing icon classes
                weatherIcon.className = '';
                
                // Add appropriate icon class based on condition
                const condition = dayData.day.condition.text.toLowerCase();
                
                if (condition.includes('sunny') || condition.includes('clear')) {
                    weatherIcon.className = 'fas fa-sun';
                } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
                    weatherIcon.className = 'fas fa-cloud-showers-heavy';
                } else if (condition.includes('cloud') || condition.includes('overcast')) {
                    weatherIcon.className = 'fas fa-cloud';
                } else if (condition.includes('snow') || condition.includes('sleet') || condition.includes('ice')) {
                    weatherIcon.className = 'fas fa-snowflake';
                } else if (condition.includes('thunder') || condition.includes('storm')) {
                    weatherIcon.className = 'fas fa-bolt';
                } else if (condition.includes('fog') || condition.includes('mist')) {
                    weatherIcon.className = 'fas fa-smog';
                } else if (condition.includes('wind')) {
                    weatherIcon.className = 'fas fa-wind';
                } else {
                    weatherIcon.className = 'fas fa-cloud-sun'; // Default fallback
                }
            }
        }
    }
}

function updateWeatherAnimation(conditionText) {
    // Remove any existing weather animation stylesheet
    const existingStylesheet = document.getElementById('weather-animation-css');
    if (existingStylesheet) {
        existingStylesheet.remove();
    }

    // Clear existing elements in the weather visualization
    const weatherVisualization = document.getElementById('weather-visualization');
    weatherVisualization.innerHTML = '';

    // Determine which CSS file to load based on the condition text and time of day
    let cssFile = '';
    const condition = conditionText.toLowerCase();
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 18 || hour < 6; // Nighttime between 6 PM and 6 AM

    if (condition.includes('sunny') || condition.includes('clear')) {
        cssFile = isNight ? 'sunny-night.css' : 'sunny.css';
        const celestialElement = document.createElement('div');
        celestialElement.className = isNight ? 'moon' : 'sun';
        weatherVisualization.appendChild(celestialElement);
    } 
    else if (condition.includes('partly cloudy')) {
        cssFile = isNight ? 'partly-cloudy-night.css' : 'partly-cloudy.css';
        const celestialElement = document.createElement('div');
        celestialElement.className = isNight ? 'moon' : 'sun';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(celestialElement);
        weatherVisualization.appendChild(cloudElement);
    }
    else if (condition.includes('cloudy') || condition.includes('overcast')) {
        cssFile = isNight ? 'cloudy-night.css' : 'cloudy.css';
        const cloudElement1 = document.createElement('div');
        cloudElement1.className = 'cloud cloud-1';
        const cloudElement2 = document.createElement('div');
        cloudElement2.className = 'cloud cloud-2';
        weatherVisualization.appendChild(cloudElement1);
        weatherVisualization.appendChild(cloudElement2);
    }
    else if (condition.includes('mist') || condition.includes('fog')) {
        cssFile = isNight ? 'fog-night.css' : 'fog.css';
        for (let i = 1; i <= 3; i++) {
            const fogElement = document.createElement('div');
            fogElement.className = `fog fog-${i}`;
            weatherVisualization.appendChild(fogElement);
        }
    }
    else if (condition.includes('heavy rain') || condition.includes('downpour')) {
        cssFile = isNight ? 'heavy-rain-night.css' : 'heavy-rain.css';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(cloudElement);
        for (let i = 1; i <= 10; i++) {
            const droplet = document.createElement('div');
            droplet.className = `droplet droplet-${i}`;
            weatherVisualization.appendChild(droplet);
        }
    }
    else if (condition.includes('light rain') || condition.includes('drizzle')) {
        cssFile = isNight ? 'light-rain-night.css' : 'light-rain.css';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(cloudElement);
        for (let i = 1; i <= 5; i++) {
            const droplet = document.createElement('div');
            droplet.className = `droplet droplet-${i}`;
            weatherVisualization.appendChild(droplet);
        }
    }
    else if (condition.includes('heavy snow')) {
        cssFile = isNight ? 'heavy-snow-night.css' : 'heavy-snow.css';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(cloudElement);
        for (let i = 1; i <= 12; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = `snowflake snowflake-${i}`;
            weatherVisualization.appendChild(snowflake);
        }
    }
    else if (condition.includes('light snow') || condition.includes('snow')) {
        cssFile = isNight ? 'light-snow-night.css' : 'light-snow.css';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(cloudElement);
        for (let i = 1; i <= 6; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = `snowflake snowflake-${i}`;
            weatherVisualization.appendChild(snowflake);
        }
    }
    else if (condition.includes('thunder') || condition.includes('storm')) {
        cssFile = 'thunderstorm.css';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        const lightningElement = document.createElement('div');
        lightningElement.className = 'lightning';
        weatherVisualization.appendChild(cloudElement);
        weatherVisualization.appendChild(lightningElement);
        for (let i = 1; i <= 8; i++) {
            const droplet = document.createElement('div');
            droplet.className = `droplet droplet-${i}`;
            weatherVisualization.appendChild(droplet);
        }
    }
    else if (condition.includes('wind')) {
        cssFile = 'windy.css';
        for (let i = 1; i <= 3; i++) {
            const windElement = document.createElement('div');
            windElement.className = `wind wind-${i}`;
            weatherVisualization.appendChild(windElement);
        }
    }
    else {
        cssFile = isNight ? 'partly-cloudy-night.css' : 'partly-cloudy.css';
        const celestialElement = document.createElement('div');
        celestialElement.className = isNight ? 'moon' : 'sun';
        const cloudElement = document.createElement('div');
        cloudElement.className = 'cloud';
        weatherVisualization.appendChild(celestialElement);
        weatherVisualization.appendChild(cloudElement);
    }

    // Create and append the new stylesheet
    const link = document.createElement('link');
    link.id = 'weather-animation-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    const cssFilePath = `weather_conditions/${cssFile}`;
    link.href = cssFilePath;
    document.head.appendChild(link);

    console.log(`Applied weather animation: ${cssFilePath}`);
}

function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('time');

    // Format date as YYYY-MM-DD
    const formattedDate = now.toLocaleDateString('en-CA');
    dateElement.textContent = formattedDate;

    // Format time as HH:MM:SS
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: false });
    timeElement.textContent = formattedTime;
}

// Call the function initially and set an interval to update every second
updateDateTime();
setInterval(updateDateTime, 1000);

function updateGreetingAndSuggestion() {
    if (!wData || !wData.current) {
        console.error('Weather data is not available.');
        return;
    }

    const greetingElement = document.querySelector('.greeting h1');
    const suggestionElement = document.querySelector('.greeting p');

    // Get the current hour
    const now = new Date();
    const hour = now.getHours();

    // Update greeting based on the time of day
    if (hour >= 5 && hour < 12) {
        greetingElement.textContent = 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
        greetingElement.textContent = 'Good Afternoon';
    } else {
        greetingElement.textContent = 'Good Evening';
    }

    // Update suggestion based on the weather condition
    const condition = wData.current.condition.text.toLowerCase();
    if (condition.includes('rain')) {
        suggestionElement.textContent = "Don't forget your umbrella!";
    } else if (condition.includes('snow')) {
        suggestionElement.textContent = "Stay warm, it's snowy outside!";
    } else if (condition.includes('sunny')) {
        suggestionElement.textContent = "It's a great day to be outdoors!";
    } else if (condition.includes('cloud')) {
        suggestionElement.textContent = "It might be cloudy, but it's still a good day!";
    } else if (condition.includes('wind')) {
        suggestionElement.textContent = "Hold onto your hat, it's windy!";
    } else {
        suggestionElement.textContent = "Enjoy your day!";
    }
}

// Call the function after weather data is fetched
updateGreetingAndSuggestion();