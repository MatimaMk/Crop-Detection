import { NextRequest, NextResponse } from "next/server";

// Type definition for location data
interface LocationData {
  name: string;
  province: string;
  country: string;
  lat: number;
  lon: number;
}

// South African cities and towns database for farming locations
const SOUTH_AFRICAN_LOCATIONS: LocationData[] = [
  // Major cities
  { name: "Cape Town", province: "Western Cape", country: "South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "Johannesburg", province: "Gauteng", country: "South Africa", lat: -26.2041, lon: 28.0473 },
  { name: "Durban", province: "KwaZulu-Natal", country: "South Africa", lat: -29.8587, lon: 31.0218 },
  { name: "Pretoria", province: "Gauteng", country: "South Africa", lat: -25.7479, lon: 28.2293 },
  { name: "Port Elizabeth", province: "Eastern Cape", country: "South Africa", lat: -33.9608, lon: 25.6022 },
  { name: "Bloemfontein", province: "Free State", country: "South Africa", lat: -29.0852, lon: 26.1596 },
  { name: "East London", province: "Eastern Cape", country: "South Africa", lat: -33.0153, lon: 27.9116 },
  { name: "Nelspruit", province: "Mpumalanga", country: "South Africa", lat: -25.4753, lon: 30.9698 },
  { name: "Kimberley", province: "Northern Cape", country: "South Africa", lat: -28.7282, lon: 24.7499 },
  { name: "Polokwane", province: "Limpopo", country: "South Africa", lat: -23.9045, lon: 29.4689 },

  // Agricultural towns and regions
  { name: "Stellenbosch", province: "Western Cape", country: "South Africa", lat: -33.9321, lon: 18.8602 },
  { name: "Paarl", province: "Western Cape", country: "South Africa", lat: -33.7391, lon: 18.9563 },
  { name: "Worcester", province: "Western Cape", country: "South Africa", lat: -33.6462, lon: 19.4485 },
  { name: "George", province: "Western Cape", country: "South Africa", lat: -33.9628, lon: 22.4619 },
  { name: "Oudtshoorn", province: "Western Cape", country: "South Africa", lat: -33.5947, lon: 22.2015 },
  { name: "Mossel Bay", province: "Western Cape", country: "South Africa", lat: -34.1816, lon: 22.1463 },

  { name: "Potchefstroom", province: "North West", country: "South Africa", lat: -26.7136, lon: 27.0962 },
  { name: "Klerksdorp", province: "North West", country: "South Africa", lat: -26.8520, lon: 26.6651 },
  { name: "Rustenburg", province: "North West", country: "South Africa", lat: -25.6674, lon: 27.2417 },
  { name: "Mahikeng", province: "North West", country: "South Africa", lat: -25.8601, lon: 25.6406 },

  { name: "Pietermaritzburg", province: "KwaZulu-Natal", country: "South Africa", lat: -29.6197, lon: 30.3794 },
  { name: "Newcastle", province: "KwaZulu-Natal", country: "South Africa", lat: -27.7574, lon: 29.9317 },
  { name: "Ladysmith", province: "KwaZulu-Natal", country: "South Africa", lat: -28.5615, lon: 29.7810 },
  { name: "Estcourt", province: "KwaZulu-Natal", country: "South Africa", lat: -29.0097, lon: 29.8671 },
  { name: "Howick", province: "KwaZulu-Natal", country: "South Africa", lat: -29.4780, lon: 30.2306 },

  { name: "Witbank", province: "Mpumalanga", country: "South Africa", lat: -25.8738, lon: 29.2321 },
  { name: "Standerton", province: "Mpumalanga", country: "South Africa", lat: -26.9334, lon: 29.2436 },
  { name: "Ermelo", province: "Mpumalanga", country: "South Africa", lat: -26.5337, lon: 29.9798 },
  { name: "Barberton", province: "Mpumalanga", country: "South Africa", lat: -25.7896, lon: 31.0536 },
  { name: "White River", province: "Mpumalanga", country: "South Africa", lat: -25.3317, lon: 31.0108 },

  { name: "Welkom", province: "Free State", country: "South Africa", lat: -27.9770, lon: 26.7137 },
  { name: "Kroonstad", province: "Free State", country: "South Africa", lat: -27.2347, lon: 27.2348 },
  { name: "Bethlehem", province: "Free State", country: "South Africa", lat: -28.2307, lon: 28.3141 },
  { name: "Sasolburg", province: "Free State", country: "South Africa", lat: -26.8139, lon: 27.8151 },
  { name: "Harrismith", province: "Free State", country: "South Africa", lat: -28.2742, lon: 29.1291 },

  { name: "Grahamstown", province: "Eastern Cape", country: "South Africa", lat: -33.3044, lon: 26.5328 },
  { name: "Queenstown", province: "Eastern Cape", country: "South Africa", lat: -31.8977, lon: 26.8753 },
  { name: "King William's Town", province: "Eastern Cape", country: "South Africa", lat: -32.8738, lon: 27.3996 },
  { name: "Uitenhage", province: "Eastern Cape", country: "South Africa", lat: -33.7577, lon: 25.3971 },
  { name: "Cradock", province: "Eastern Cape", country: "South Africa", lat: -32.1641, lon: 25.6133 },

  { name: "Upington", province: "Northern Cape", country: "South Africa", lat: -28.4478, lon: 21.2560 },
  { name: "Springbok", province: "Northern Cape", country: "South Africa", lat: -29.6649, lon: 17.8886 },
  { name: "De Aar", province: "Northern Cape", country: "South Africa", lat: -30.6499, lon: 24.0122 },
  { name: "Kuruman", province: "Northern Cape", country: "South Africa", lat: -27.4550, lon: 23.4329 },

  { name: "Tzaneen", province: "Limpopo", country: "South Africa", lat: -23.8329, lon: 30.1628 },
  { name: "Louis Trichardt", province: "Limpopo", country: "South Africa", lat: -23.0439, lon: 29.9028 },
  { name: "Mokopane", province: "Limpopo", country: "South Africa", lat: -24.1940, lon: 29.0067 },
  { name: "Thohoyandou", province: "Limpopo", country: "South Africa", lat: -22.9487, lon: 30.4850 },
  { name: "Giyani", province: "Limpopo", country: "South Africa", lat: -23.3027, lon: 30.7184 },

  // Additional agricultural areas
  { name: "Vredendal", province: "Western Cape", country: "South Africa", lat: -31.6689, lon: 18.5062 },
  { name: "Malmesbury", province: "Western Cape", country: "South Africa", lat: -33.4607, lon: 18.7299 },
  { name: "Swellendam", province: "Western Cape", country: "South Africa", lat: -34.0235, lon: 20.4407 },
  { name: "Caledon", province: "Western Cape", country: "South Africa", lat: -34.2313, lon: 19.4338 },
  { name: "Robertson", province: "Western Cape", country: "South Africa", lat: -33.8047, lon: 19.8886 },
  { name: "Montagu", province: "Western Cape", country: "South Africa", lat: -33.7879, lon: 20.1218 },
  { name: "Ladismith", province: "Western Cape", country: "South Africa", lat: -33.4925, lon: 21.2524 },
];

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

    // Filter South African locations based on the search query
    const filteredLocations = SOUTH_AFRICAN_LOCATIONS
      .filter(location => {
        const searchTerm = query.toLowerCase();
        return (
          location.name.toLowerCase().includes(searchTerm) ||
          location.province.toLowerCase().includes(searchTerm)
        );
      })
      .slice(0, 10) // Limit to 10 results
      .map(location => ({
        name: location.name,
        country: location.country,
        state: location.province,
        displayName: `${location.name}, ${location.province}`,
        coordinates: {
          lat: location.lat,
          lon: location.lon
        }
      }));

    return NextResponse.json({
      query,
      locations: filteredLocations
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

    const OPENWEATHER_API_KEY = "db273e8ddc881de632c7c66f04c5063b";

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        throw new Error("No location found for coordinates");
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
    } catch (apiError) {
      console.warn("OpenWeather API failed, trying to find closest South African location:", apiError);

      // Fallback: Find closest South African location from our database
      let closestLocation: LocationData | undefined = undefined;
      let minDistance = Infinity;

      SOUTH_AFRICAN_LOCATIONS.forEach((location: LocationData) => {
        const distance = Math.sqrt(
          Math.pow(location.lat - lat, 2) + Math.pow(location.lon - lon, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = location;
        }
      });

      if (closestLocation) {
        const location = closestLocation as LocationData;
        return NextResponse.json({
          name: location.name,
          country: location.country,
          state: location.province,
          displayName: `${location.name}, ${location.province}`,
          coordinates: {
            lat: location.lat,
            lon: location.lon
          },
          fallback: true,
          message: "Using closest South African location"
        });
      }

      throw new Error("Could not determine location");
    }
  } catch (error) {
    console.error("Current location API error:", error);

    return NextResponse.json(
      {
        error: "Failed to get current location",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}