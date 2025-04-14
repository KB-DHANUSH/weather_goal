// Enhanced Geolocation for Weather App
let lat;
let lon;
let url;
let fUrl;
let wData;
let fData;

// Create geolocation options for better precision
const geoOptions = {
  enableHighAccuracy: true,  // Request the most accurate position
  timeout: 10000,            // Wait up to 10 seconds
  maximumAge: 0              // Don't use cached position
};

// Initialize location with progressive enhancement
function initializeLocation() {
    // Try for quick location first
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Set initial coordinates
            updateCoordinates(position);
            console.log(`Initial location: ${lat}, ${lon} (±${position.coords.accuracy}m)`);
            
            // Setup weather URLs and prefetch data
            setupWeatherURLs();
            getWeather();
            
            // Then try for more accurate location
            setTimeout(() => {
                getHighAccuracyLocation();
            }, 100);
        },
        (error) => {
            console.error("Error getting initial location: ", error);
            // Fall back to IP-based location
            getIPBasedLocation();
        },
        { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 } // Quick initial position
    );
}

// Function to get high accuracy location
function getHighAccuracyLocation() {
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            // Only update if accuracy is better than what we have
            if (!lat || !lon || position.coords.accuracy < window.lastAccuracy) {
                updateCoordinates(position);
                console.log(`Location updated: ${lat}, ${lon} (±${position.coords.accuracy}m)`);
                
                // Update weather data with more accurate location
                setupWeatherURLs();
                getWeather();
                
                // If accuracy is under 50m, we can stop watching
                if (position.coords.accuracy < 50) {
                    navigator.geolocation.clearWatch(watchId);
                    console.log("Achieved desired accuracy, stopped watching position");
                }
            }
        },
        (error) => {
            console.error("Error getting high accuracy location: ", error);
            navigator.geolocation.clearWatch(watchId);
        },
        geoOptions
    );
    
    // Stop watching after 20 seconds to save battery
    setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        console.log("Stopped location watching after timeout");
    }, 20000);
}

// Fallback to IP-based location if GPS fails
async function getIPBasedLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
            lat = data.latitude;
            lon = data.longitude;
            window.lastAccuracy = 5000; // IP location is typically not very accurate
            
            console.log(`IP-based location: ${lat}, ${lon}`);
            setupWeatherURLs();
            getWeather();
        }
    } catch (error) {
        console.error("Error getting IP-based location:", error);
    }
}

// Update coordinates and store accuracy
function updateCoordinates(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    // Store accuracy for comparison
    window.lastAccuracy = position.coords.accuracy;
}

// Setup weather API URLs
function setupWeatherURLs() {
    const apiKey = "4c7e9fb2762e4f7c9d1130502253103";
    url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=yes&days=5`;
    fUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});

let update = document.getElementById('update');
update.addEventListener('click', () => {
    // On manual update, try for high accuracy again
    getHighAccuracyLocation();
    getWeather();
});

async function getWeather() {
    try {
        // Show loading state
        document.getElementById('address').innerText = "Fetching weather data...";
        
        const response = await fetch(url);
        const fResponse = await fetch(fUrl);
        wData = await response.json();
        fData = await fResponse.json();
        
        console.log(wData);
        console.log(fData);
        
        updateValues();
        updateForecast(fData);
        updateWeatherAnimation(wData.current.condition.text);
        updateGreetingAndSuggestion();
        updateDateTimeForLocation();
    }
    catch(error) {
        console.log(error);
        document.getElementById('address').innerText = "Error fetching weather data";
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
    const localTime = new Date(wData.location.localtime.replace(' ', 'T'));
    const hour = localTime.getHours();
    const isNight = hour >= 18 || hour < 6; // Nighttime between 6 PM and 6 AM

    console.log('Condition Text:', conditionText);
    console.log('Is Night:', isNight);
    console.log('CSS File Path:', `weather_conditions/${cssFile}`);

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

    if (isNight) {
        // Add stars for nighttime
        for (let i = 1; i <= 20; i++) {
            const star = document.createElement('div');
            star.className = `star star-${i}`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            weatherVisualization.appendChild(star);
        }
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

let locationTimeInterval;

function updateDateTimeForLocation() {
    if (!wData || !wData.location || !wData.location.localtime) {
        console.error('Local time data is not available.');
        return;
    }

    const localTime = new Date(wData.location.localtime.replace(' ', 'T'));
    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('time');

    // Format date as YYYY-MM-DD
    const formattedDate = localTime.toLocaleDateString('en-CA');
    dateElement.textContent = formattedDate;

    // Format time as HH:MM:SS
    const formattedTime = localTime.toLocaleTimeString('en-US', { hour12: false });
    timeElement.textContent = formattedTime;

    // Clear any existing interval for updating time
    if (locationTimeInterval) {
        clearInterval(locationTimeInterval);
    }

    // Start a new interval to update the time every second
    locationTimeInterval = setInterval(() => {
        localTime.setSeconds(localTime.getSeconds() + 1);
        const updatedTime = localTime.toLocaleTimeString('en-US', { hour12: false });
        timeElement.textContent = updatedTime;
    }, 1000);
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
// Add this to your existing JavaScript file

// Location search functionality
document.addEventListener('DOMContentLoaded', () => {
    const pickLocationBtn = document.getElementById('pick-location');
    const locationSearch = document.getElementById('location-search');
    const locationInput = document.getElementById('location-input');
    const searchButton = document.getElementById('search-button');
    
    // Toggle location search area when "Pick Location" is clicked
    pickLocationBtn.addEventListener('click', () => {
        // Toggle active class on Pick Location button
        pickLocationBtn.classList.toggle('active');
        
        // Toggle visibility of search area
        locationSearch.classList.toggle('hidden');
        
        // If showing search box, focus on it
        if (!locationSearch.classList.contains('hidden')) {
            locationInput.focus();
        }
    });
    
    // Handle search button click
    searchButton.addEventListener('click', () => {
        searchLocation();
    });
    
    // Handle Enter key press in input
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Search location function
    function searchLocation() {
        const locationName = locationInput.value.trim();
        
        if (locationName) {
            // Clear input
            locationInput.value = '';
            
            // Hide search area
            locationSearch.classList.add('hidden');
            pickLocationBtn.classList.remove('active');
            
            // Show loading state or indicator
            document.getElementById('address').innerText = `Searching for ${locationName}...`;
            
            // Get weather for the entered location
            getWeatherByLocation(locationName);
        }
    }
});

// Function to get weather by location name
async function getWeatherByLocation(locationName) {
    try {
        const apiKey = "4c7e9fb2762e4f7c9d1130502253103";
        
        // First, get coordinates from location name
        const locationUrl = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(locationName)}`;
        
        const locationResponse = await fetch(locationUrl);
        const locationData = await locationResponse.json();
        
        if (locationData && locationData.length > 0) {
            // Get first location result
            const location = locationData[0];
            
            // Update lat and lon
            lat = location.lat;
            lon = location.lon;
            
            console.log(`Found location: ${location.name}, ${location.region}, ${location.country}`);
            console.log(`Coordinates: ${lat}, ${lon}`);
            
            // Setup URLs and get weather
            setupWeatherURLs();
            getWeather();
        } else {
            // Handle location not found
            console.error("Location not found");
            document.getElementById('address').innerText = "Location not found, please try again";
            setTimeout(() => {
                document.getElementById('pick-location').click();
            }, 2000);
        }
    } catch (error) {
        console.error("Error getting location weather:", error);
        document.getElementById('address').innerText = "Error getting location, please try again";
    }
}