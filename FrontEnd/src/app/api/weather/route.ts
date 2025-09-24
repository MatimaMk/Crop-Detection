import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json(
        { error: "Location parameter is required" },
        { status: 400 }
      );
    }

    // Use direct API key for OpenWeather (replace with your own)
    const OPENWEATHER_API_KEY = "your_openweather_api_key_here";

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "your_openweather_api_key_here") {
      return NextResponse.json(
        { error: "Weather API key not configured - please add your OpenWeather API key" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Weather API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind?.speed || 0,
      pressure: data.main.pressure,
      location: data.name,
      country: data.sys.country,
      icon: data.weather[0].icon,
      // Calculate derived values for dashboard
      rainfall: data.rain?.['1h'] || 0, // mm in last hour
      sunlight: calculateSunlightHours(data.weather[0].id, data.dt, data.sys.sunrise, data.sys.sunset),
      visibility: data.visibility ? data.visibility / 1000 : 10, // convert to km
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Helper function to estimate sunlight hours based on weather conditions
function calculateSunlightHours(weatherId: number, currentTime: number, sunrise: number, sunset: number): number {
  const dayLightHours = (sunset - sunrise) / 3600; // Convert to hours

  // Adjust based on weather conditions
  let sunlightMultiplier = 1;

  if (weatherId >= 200 && weatherId < 300) {
    // Thunderstorm
    sunlightMultiplier = 0.1;
  } else if (weatherId >= 300 && weatherId < 500) {
    // Drizzle
    sunlightMultiplier = 0.3;
  } else if (weatherId >= 500 && weatherId < 600) {
    // Rain
    sunlightMultiplier = 0.2;
  } else if (weatherId >= 600 && weatherId < 700) {
    // Snow
    sunlightMultiplier = 0.15;
  } else if (weatherId >= 700 && weatherId < 800) {
    // Atmosphere (fog, mist, etc.)
    sunlightMultiplier = 0.4;
  } else if (weatherId === 800) {
    // Clear sky
    sunlightMultiplier = 1;
  } else if (weatherId > 800) {
    // Clouds
    const cloudMultiplier = {
      801: 0.8, // few clouds
      802: 0.6, // scattered clouds
      803: 0.4, // broken clouds
      804: 0.2  // overcast clouds
    };
    sunlightMultiplier = cloudMultiplier[weatherId as keyof typeof cloudMultiplier] || 0.3;
  }

  return Math.round(dayLightHours * sunlightMultiplier * 10) / 10;
}