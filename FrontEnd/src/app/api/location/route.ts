import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Use OpenWeather Geocoding API for location suggestions
    const OPENWEATHER_API_KEY = "your_openweather_api_key_here";

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "your_openweather_api_key_here") {
      return NextResponse.json(
        { error: "Weather API key not configured - please add your OpenWeather API key" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Geocoding API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the data to a more user-friendly format
    const locations = data.map((location: any) => ({
      name: location.name,
      country: location.country,
      state: location.state || null,
      displayName: `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      }
    }));

    return NextResponse.json({
      query,
      locations
    });
  } catch (error) {
    console.error("Location API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch location data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST endpoint for reverse geocoding (get location from coordinates)
export async function POST(request: NextRequest) {
  try {
    const { lat, lon } = await request.json();

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const OPENWEATHER_API_KEY = "your_openweather_api_key_here";

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "your_openweather_api_key_here") {
      return NextResponse.json(
        { error: "Weather API key not configured - please add your OpenWeather API key" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Reverse geocoding API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No location found for the provided coordinates" },
        { status: 404 }
      );
    }

    const location = data[0];
    const locationData = {
      name: location.name,
      country: location.country,
      state: location.state || null,
      displayName: `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      }
    };

    return NextResponse.json(locationData);
  } catch (error) {
    console.error("Reverse geocoding API error:", error);

    return NextResponse.json(
      {
        error: "Failed to reverse geocode coordinates",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}