
API Notes Document
API Notes: NASA InSight Mars Weather API
1️⃣ API Name

NASA InSight: Mars Weather Service

Provides daily weather data from the InSight lander on Mars.

Includes temperature, wind, pressure, and sol (Martian day) information.

2️⃣ Endpoint Used
https://api.nasa.gov/insight_weather/

Full URL with query parameters example:

https://api.nasa.gov/insight_weather/?api_key=YOUR_API_KEY&feedtype=json&ver=1.0

3️⃣ Parameters Used
Parameter	Description	Example
api_key	Your personal NASA API key (or DEMO_KEY for testing)	DEMO_KEY
feedtype	Format of the response	json
ver	API version	1.0

Optional notes:

api_key is required — without a valid key, the API returns 403 Forbidden.

feedtype=json ensures you receive JSON data, which is easier to process in JavaScript.

4️⃣ Example Response Format

The API returns JSON. Key properties:

{
  "sol_keys": ["675", "676", "677"],
  "675": {
    "AT": { "av": -62.314, "mn": -70.0, "mx": -55.0 },
    "HWS": { "av": 7.233, "mn": 3.5, "mx": 12.0 },
    "WD": { "most_common": { "compass_point": "WNW", "compass_degrees": 292.5 } },
    "PRE": { "av": 720.0, "mn": 710.0, "mx": 730.0 },
    "Season": "winter",
    "First_UTC": "2026-03-01T12:00:00Z",
    "Last_UTC": "2026-03-02T12:00:00Z"
  },
  "676": { ... },
  "677": { ... }
}

Notes on response fields:

Field	Description

sol_keys	Array of available Martian days (sols) in the response
AT	Atmosphere temperature with av (average), mn (minimum), mx (maximum)
HWS	Horizontal wind speed with av, mn, mx
WD	Wind direction; most_common has compass point and degrees
PRE	Atmospheric pressure with av, mn, mx
Season	Current Martian season
First_UTC / Last_UTC	UTC timestamps of first and last readings for the sol

✅ Notes

The API returns data for multiple sols in one request.

Not every sol has every field — some values may be missing (null).

Your app can loop through sol_keys to generate a forecast display.