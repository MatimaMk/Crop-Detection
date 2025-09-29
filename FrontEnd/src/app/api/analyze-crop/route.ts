import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with direct API key
const genAI = new GoogleGenerativeAI("AIzaSyDefMd3KBOFKGchBK9AoVZgQ45aiqbnPQ8");

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const {
      image,
      mimeType,
      userId,
      farmName,
      userName,
      userLocation,
      farmSize,
      cropTypes,
      experienceYears,
      phoneNumber,
    } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType in request" },
        { status: 400 }
      );
    }

    // Google AI API key is now hardcoded, so this check is no longer needed

    // Get current weather data for the farm location
    const weatherData = await getCurrentWeather(userLocation);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create farm-specific prompt for crop disease analysis
    const prompt = `
      You are an expert agricultural AI assistant analyzing a crop image for ${userName} from ${farmName} farm.

      FARM CONTEXT:
      - Farm Name: ${farmName}
      - Location: ${userLocation}
      - Farm Size: ${farmSize} acres
      - Farmer's Experience: ${experienceYears} years
      - Crops Grown: ${cropTypes?.join(", ") || "Various crops"}

      CURRENT WEATHER CONDITIONS:
      ${
        weatherData
          ? `
      - Temperature: ${weatherData.temperature}°C
      - Humidity: ${weatherData.humidity}%
      - Weather: ${weatherData.description}
      - Wind Speed: ${weatherData.windSpeed} m/s
      `
          : "Weather data unavailable"
      }

      ANALYSIS REQUIRED:
      Analyze this crop/plant image considering the above farm context and current weather conditions.
      Consider how the current weather and local conditions might affect plant health and disease development.

      Provide your analysis in this EXACT JSON format:
      {
        "isHealthy": boolean,
        "detectedDisease": "string or null",
        "plantType": "identified plant/crop type",
        "confidence": number (0-100),
        "observations": "detailed observations about the plant's condition, considering current weather and farm conditions",
        "treatment": {
          "immediate": "immediate treatment recommendations specific to this farm's conditions",
          "prevention": "prevention measures considering the farm's climate and crops",
          "followUp": "follow-up care instructions tailored to the farmer's experience level"
        },
        "severity": "mild/moderate/severe",
        "environmentalFactors": "how current weather/climate affects this condition",
        "farmSpecificAdvice": "advice specific to this farm's crops and location"
      }

      Focus on:
      - Identifying the specific plant type from the farmer's known crops if possible
      - Analyzing how current weather conditions might contribute to any observed issues
      - Providing treatment advice appropriate for a ${experienceYears}-year experienced farmer
      - Considering the farm's location (${userLocation}) for climate-specific advice
      - Being specific about symptoms and their relationship to environmental conditions
    `;

    // Analyze the image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", text);

      return NextResponse.json(
        {
          error: "Failed to parse AI analysis response",
          details: "The AI response could not be parsed. Please try again.",
          rawResponse: text.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Ensure all required fields are present and add farm-specific info
    const validatedResult = {
      isHealthy: analysisResult.isHealthy ?? true,
      detectedDisease: analysisResult.detectedDisease ?? null,
      plantType: analysisResult.plantType ?? "Unknown plant",
      confidence: Math.min(100, Math.max(0, analysisResult.confidence ?? 70)),
      observations: analysisResult.observations ?? "Analysis completed",
      treatment: {
        immediate:
          analysisResult.treatment?.immediate ?? "Monitor plant condition",
        prevention:
          analysisResult.treatment?.prevention ?? "Maintain proper plant care",
        followUp:
          analysisResult.treatment?.followUp ??
          "Regular health checks recommended",
      },
      severity: analysisResult.severity ?? "mild",
      environmentalFactors:
        analysisResult.environmentalFactors ?? "Weather conditions normal",
      farmSpecificAdvice:
        analysisResult.farmSpecificAdvice ??
        "Continue current farming practices",
      analyzedBy: userName,
      farmName: farmName,
      farmLocation: userLocation,
      farmSize: farmSize,
      currentWeather: weatherData,
      timestamp: new Date().toISOString(),
    };

    // Send WhatsApp notification if disease detected and phone number provided
    if (!validatedResult.isHealthy && phoneNumber) {
      try {
        const whatsappResponse = await fetch(`${request.nextUrl.origin}/api/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            diseaseName: validatedResult.detectedDisease,
            plantType: validatedResult.plantType,
            severity: validatedResult.severity,
            treatment: validatedResult.treatment
          }),
        });

        if (whatsappResponse.ok) {
          const whatsappData = await whatsappResponse.json();
          console.log('WhatsApp notification sent successfully:', whatsappData.messageSid);
          validatedResult.whatsappSent = true;
        } else {
          console.warn('Failed to send WhatsApp notification');
          validatedResult.whatsappSent = false;
        }
      } catch (whatsappError) {
        console.error('WhatsApp notification error:', whatsappError);
        validatedResult.whatsappSent = false;
      }
    }

    return NextResponse.json(validatedResult);
  } catch (error) {
    console.error("Crop analysis error:", error);

    return NextResponse.json(
      {
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        note: "Please ensure Google AI API key is properly configured",
      },
      { status: 500 }
    );
  }
}

// Get current weather data for the farm location
async function getCurrentWeather(location: string) {
  try {
    // Use a direct API key for OpenWeather (replace with your own)
    const OPENWEATHER_API_KEY = "be44b26d4e6a960fe5e06a50eced870b";

    if (!location || !OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "your_openweather_api_key_here") {
      console.warn("Weather API unavailable: Missing location or API key");
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location
      )}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      console.warn("Weather API request failed:", response.status);
      return null;
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      location: data.name,
    };
  } catch (error) {
    console.warn("Failed to fetch weather data:", error);
    return null;
  }
}
