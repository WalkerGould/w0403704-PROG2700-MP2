
/* Student: Walker Gould
Student ID: w0403704
Course: Prog2700
Assignment: PROG2700 — Mini-Project 2 (MP2) Public API Explorer UI (Vanilla JavaScript + Tailwind CSS)
Instructor: Davis Boudreau
Date: March 17th, 2026 
*/



const form = document.getElementById("search-form"); // correct in html
const cityInputMars = document.getElementById("mars-weather");
const countryInputPlaceholder = document.getElementById("Placerholder");
const apiKeyInput = document.getElementById("apiKey"); // correct in html

const statusEl = document.getElementById("status"); // correct in html
const errorEl = document.getElementById("error"); // correct in html
const currentEl = document.getElementById("current"); // correct in html
const forecastEl = document.getElementById("forecast"); // correct in html

//const clearBtn = document.getElementById("clear-btn"); // correct in html
const searchBtn = document.getElementById("search-btn"); // correct in html
const unitsBtn = document.getElementById("units-btn"); // correct in html unit switch button, e.g celsius to farheinet
const filterTimesCheckbox = document.getElementById("filterTimes"); // correct in html
let filterTimes = false; // default = show all
const maxSolsInput = document.getElementById("maxSolsInput");

let currentMaxSols = 7;      // start with 3 sols
const maxSolsOptions = [3, 5, 7, 10, 15]; // preset options
// Create a button in your HTML or select it if it exists
const adjustSolsBtn = document.getElementById("adjustSolsBtn");

// Set initial button label
adjustSolsBtn.textContent = `Show ${currentMaxSols} sols`;
// let units = "metric"; // default = Celsius /// default unit = metric
/*
Part D — Implement API Integration
Your JavaScript code must:

Use fetch() to retrieve data
Use async / await
Parse JSON responses
Render results to the DOM
Example pattern:

async function getData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("API request failed");
    }

    return await response.json();
}
Your application should separate logic such as:

API requests
UI rendering
Event handling

*/
function setStatus(msg) {
  statusEl.textContent = msg || "";
}

// Task 2 — Better Errors ************************
// If error includes “401”, show: “Invalid API Key” If error includes “404”, show: “City not found”
function setError(msg) {
  if (!msg) {
    errorEl.textContent = "";
    return;
  }

  const err = msg.toString();
  let message = err; // default = show the original message

  if (err.includes("401")) {
    message = "Invalid API Key";
  } else if (err.includes("404")) {
    message = "Mars search not found";
  }

  errorEl.textContent = message;
}


function disableSearch(disabled) {
  searchBtn.disabled = disabled;
}

function toTitleCase(s) {
  return s
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Convert unix seconds -> readable local date/time
function formatUnixTime(unixSeconds) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString(); // uses user locale/timezone
}

//  Step JS-3 — Fetch Basics (Async/Await + Error Handling)

async function fetchJson(url) {
  // Fetch returns a Promise -> await pauses until the Promise resolves
  const res = await fetch(url);

  // REST concept: status codes
  // 200-299 = OK
  // 401 = invalid key, 404 = not found city, etc.
  if (!res.ok) {
    // Try to extract error details (OpenWeather typically returns JSON)
    let detail = "";
    try {
      const errData = await res.json();
      detail = errData?.message ? ` (${errData.message})` : "";
    } catch {
      // ignore parse errors
    }
    throw new Error(`HTTP ${res.status}${detail}`);
  }

  // JSON parsing (text -> JS object)
  return await res.json();
}



//url = GET https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0
async function getData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("API request failed");
    }

    return await response.json();
}

getData("https://api.nasa.gov/insight_weather/?api_key=&feedtype=json&ver=1.0")
  .then(data => console.log(data))
  .catch(error => console.error(error));


// Safely read nested properties without crashing the app
function safeGet(obj, path, fallback = null) {
  try {
    return path.split(".").reduce((acc, key) => acc[key], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function buildNasaWeatherUrl({ apiKey, feedtype = "json", version = "1.0" }) {
  const params = new URLSearchParams({
    api_key: apiKey,
    feedtype,
    ver: version
  });

  return `https://api.nasa.gov/insight_weather/?${params.toString()}`;
}

async function getMarsWeather() {
  const url = buildNasaWeatherUrl({ apiKey: "rNNWfZd2LdGhgNfrZhsGOHf9A5eYcedHkaWEN1VN" });

  const data = await getData(url);

  return data.sol_keys.map(sol => ({
    sol,
    atmosphere_temp: safeGet(data, `${sol}.AT.av`),
    wind_speed: safeGet(data, `${sol}.HWS.av`),
    wind_direction: safeGet(data, `${sol}.WD.most_common.compass_point`),
    wind_degrees: safeGet(data, `${sol}.WD.most_common.compass_degrees`),
    atmosphere_pressure: safeGet(data, `${sol}.PRE.av`),
    season: safeGet(data, `${sol}.Season`),
    firstUTC: safeGet(data, `${sol}.First_UTC`),
    lastUTC: safeGet(data, `${sol}.Last_UTC`)
}));
}

getMarsWeather().then(console.log);

//  Step JS-4 — Render Functions (DOM Creation)
/*
function clearUI() {
  setStatus("");
  setError("");
  currentEl.innerHTML = `<p class="text-slate-500">Click the button to load data..</p>`;
  forecastEl.innerHTML = "";
}
*/
// Global variable for last displayed data
//let lastForecastData = null;

// Clear UI function
function clearUI() {
  const currentEl = document.getElementById("current");
  const forecastEl = document.getElementById("forecast");

  if (currentEl) {
    currentEl.innerHTML = `<p class="text-slate-500">Click the button to load data..</p>`;
  }

  if (forecastEl) {
    forecastEl.innerHTML = "";
  }

  lastForecastData = null;

  if (typeof setStatus === "function") setStatus("");
  if (typeof setError === "function") setError("");
}

// Hook the button
const clearBtn = document.getElementById("clear-btn");
if (clearBtn) {
  clearBtn.addEventListener("click", clearUI);
}

function renderCurrentMarsSnapshot(data) {
  // Get the latest sol
  const sols = safeGet(data, "sol_keys", []);
  if (!sols.length) {
    currentEl.innerHTML = `<p class="text-slate-500">No Mars weather data returned.</p>`;
    return;
  }

  const latestSol = sols[sols.length - 1];
  const solData = safeGet(data, latestSol, {});

  // Extract fields safely
  const temp = safeGet(solData, "AT.av", "?");
  const windSpeed = safeGet(solData, "HWS.av", "?");
  const windDir = safeGet(solData, "WD.most_common.compass_point", "?");
  const pressure = safeGet(solData, "PRE.av", "?");
  const season = safeGet(solData, "Season", "?");
  const firstUTC = safeGet(solData, "First_UTC", "");
  const lastUTC = safeGet(solData, "Last_UTC", "");

  currentEl.innerHTML = `
    <div class="space-y-2">
      <p class="text-slate-800 font-semibold">Mars Sol ${latestSol}</p>
      <p><span class="font-medium">First UTC:</span> ${firstUTC}</p>
      <p><span class="font-medium">Last UTC:</span> ${lastUTC}</p>
      <p><span class="font-medium">Temp:</span> ${temp}°C</p>
      <p><span class="font-medium">Wind:</span> ${windSpeed} m/s ${windDir}</p>
      <p><span class="font-medium">Pressure:</span> ${pressure} Pa</p>
      <p><span class="font-medium">Season:</span> ${season}</p>
    </div>
  `;
}
  

// 09:00, 12:00, 15:00 (for example) Hint: filter using item.dt_txt if present.
const allowedTimes = ["09:00:00", "12:00:00", "15:00:00"];
const allowedHours = [9, 12, 15]; // 9AM, 12PM, 3PM local

function renderMarsForecastCards(data, maxSols = 15) {
  const sols = safeGet(data, "sol_keys", []);
  if (!Array.isArray(sols) || sols.length === 0) {
    forecastEl.innerHTML = `<p class="text-slate-500">No Mars weather entries found.</p>`;
    return;
  }

  // Take the latest `maxSols` sols
  const latestSols = sols.slice(-maxSols);

  forecastEl.innerHTML = "";
  forecastEl.className =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  for (const sol of latestSols) {
    const solData = safeGet(data, sol, {});

    const temp = safeGet(solData, "AT.av", "?");
    const windSpeed = safeGet(solData, "HWS.av", "?");
    const windDir = safeGet(solData, "WD.most_common.compass_point", "?");
    const pressure = safeGet(solData, "PRE.av", "?");
    const season = safeGet(solData, "Season", "?");
    const firstUTC = safeGet(solData, "First_UTC", "");
    const lastUTC = safeGet(solData, "Last_UTC", "");

    const card = document.createElement("div");
    card.className =
      "rounded-xl border border-slate-200 p-4 bg-slate-50 flex flex-col items-center text-center shadow-sm hover:shadow-md transition";

    card.innerHTML = `
      <h3 class="text-sm text-slate-600 mb-1">Sol ${sol}</h3>
      <p class="text-xs text-gray-500 mb-1">UTC: ${firstUTC} → ${lastUTC}</p>
      <p class="text-lg font-semibold text-red-700 mb-1">${temp}°C</p>
      <p class="text-sm text-slate-700 mb-1">Wind: ${windSpeed} m/s ${windDir}</p>
      <p class="text-xs text-slate-600">Pressure: ${pressure} Pa</p>
      <p class="text-xs text-slate-600">Season: ${season}</p>
    `;

    forecastEl.appendChild(card);
  }
}

async function runMarsWeather() {
  setError(""); // clear previous errors

  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    setError("Please paste your NASA API key.");
    return;
  }

  disableSearch(true);
  setStatus("Loading Mars weather…");
  currentEl.innerHTML = `<p class="text-slate-500">Loading…</p>`;
  forecastEl.innerHTML = "";

  try {
    // Build URL for NASA InSight API
    const url = buildNasaWeatherUrl({ apiKey });

    // Fetch JSON data
    const data = await fetchJson(url);

    lastForecastData = data;

    // Render the current snapshot (latest sol)
    renderCurrentMarsSnapshot(data);

    // Render the forecast cards (latest 7 sols)
    renderMarsForecastCards(data, 7);

    setStatus("Loaded Mars weather forecast.");

  } catch (error) {
    console.error(error);
    setStatus("");
    setError(error.message || error);
    currentEl.innerHTML = `<p class="text-slate-500">No data.</p>`;
    forecastEl.innerHTML = "";
  } finally {
    disableSearch(false);
  }
}

searchBtn.addEventListener("click", runMarsWeather);
form.addEventListener("submit", (e) => {
  e.preventDefault(); // prevent full page refresh
  runMarsWeather()
});

clearBtn.addEventListener("click", () => {
  cityInputMars.value = "";
  //countryInputPlaceholder.value = "";
  // Leave apiKey as-is so students don't re-paste constantly
  clearUI();
});

let lastForecastData = null; // cached API data

filterTimesCheckbox.addEventListener("change", () => {
  filterTimes = filterTimesCheckbox.checked;
  if (lastForecastData) renderForecastCards(lastForecastData);
});

unitsBtn.addEventListener("click", () => { // toggle botton for metrics/units

  units = units === "metric" ? "imperial" : "metric";

  unitsBtn.textContent = units === "metric" ? "°C" : "°F";

  runMarsWeather()

});

// let lastForecastData = null;

//let lastForecastData = null; // cached NASA Mars weather data


// Add click listener
adjustSolsBtn.addEventListener("click", () => {
  // Cycle to next maxSols value
  const currentIndex = maxSolsOptions.indexOf(currentMaxSols);
  const nextIndex = (currentIndex + 1) % maxSolsOptions.length;
  currentMaxSols = maxSolsOptions[nextIndex];

  // Update button label
  adjustSolsBtn.textContent = `Show ${currentMaxSols} sols`;

  // Re-render forecast if we have cached data
  if (lastForecastData) renderMarsForecastCards(lastForecastData, currentMaxSols);
    //runMarsWeather();
});

// Startup
clearUI();
setStatus("Enter a planet and click Get Forecast.");
/* working\
async function getMarsWeather() {
  const url = buildNasaWeatherUrl({ apiKey: "rNNWfZd2LdGhgNfrZhsGOHf9A5eYcedHkaWEN1VN" });

  const data = await getData(url);

  return data.sol_keys.map(sol => ({
    sol,
    atmosphere_temp: data[sol].AT?.av,
    wind_speed: data[sol].HWS?.av,
    wind_direction: data[sol].WD?.most_common?.compass_point,
    wind_degrees: data[sol].WD?.most_common?.compass_degrees,
    atmosphere_pressure: data[sol].PRE?.av,
    season: data[sol].Season,
    firstUTC: data[sol].First_UTC,
    lastUTC: data[sol].Last_UTC
  }));
}
*/
// Use:

//data.sol_keys.map(sol => data[sol])
//to access each sol’s weather.


