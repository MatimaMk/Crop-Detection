import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI with environment variable
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Supported crops and their diseases
const CROP_DISEASE_MAP: Record<string, string[]> = {
  "Apple": ["Scab", "Rust", "Healthy leaf"],
  "Bell pepper": ["Leaf spot", "Healthy leaf"],
  "Blueberry": ["Healthy leaf"],
  "Cherry": ["Healthy leaf"],
  "Corn": ["Gray leaf spot", "Leaf blight", "Rust", "Healthy leaf"],
  "Peach": ["Healthy leaf"],
  "Potato": ["Early blight", "Late blight", "Healthy leaf"],
  "Raspberry": ["Healthy leaf"],
  "Soybean": ["Healthy leaf"],
  "Squash": ["Powdery mildew", "Healthy leaf"],
  "Strawberry": ["Healthy leaf"],
  "Tomato": ["Early blight", "Septoria leaf spot", "Bacterial spot", "Late blight", "Mosaic virus", "Yellow virus", "Mold", "Two spotted spider mites", "Healthy leaf"],
  "Grape": ["Black rot", "Healthy leaf"]
};

// Validate detected disease against crop type
function validateDiseaseForCrop(plantType: string, detectedDisease: string): string {
  // Normalize plant type (case-insensitive matching)
  const normalizedPlantType = Object.keys(CROP_DISEASE_MAP).find(
    crop => crop.toLowerCase() === plantType.toLowerCase()
  );

  if (!normalizedPlantType) {
    console.warn(`Plant type "${plantType}" not in supported list`);
    return detectedDisease; // Return as-is if plant not recognized
  }

  const validDiseases = CROP_DISEASE_MAP[normalizedPlantType];

  // Check if disease is valid for this crop (case-insensitive)
  const normalizedDisease = validDiseases.find(
    disease => disease.toLowerCase() === detectedDisease.toLowerCase()
  );

  if (normalizedDisease) {
    return normalizedDisease; // Return properly capitalized disease name
  }

  // If disease not found, default to "Healthy leaf" or first valid disease
  console.warn(`Disease "${detectedDisease}" not valid for ${normalizedPlantType}, defaulting to Healthy leaf`);
  return "Healthy leaf";
}

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // First, validate that the image is a plant/crop
    const supportedCropsList = Object.keys(CROP_DISEASE_MAP).join(", ");

    const validationPrompt = `
      Analyze this image and determine if it shows a plant, crop, or vegetation.

      SUPPORTED CROPS IN OUR SYSTEM:
      ${supportedCropsList}

      Respond with ONLY a JSON object in this exact format:
      {
        "isPlant": true/false,
        "isDefinedCrop": true/false,
        "identifiedPlant": "name of the plant/crop if recognizable",
        "reason": "brief explanation"
      }

      Return isPlant=true only if the image shows:
      - Living plants, crops, or vegetation
      - Plant leaves, stems, flowers, or fruits
      - Agricultural crops or garden plants

      Return isPlant=false if the image shows:
      - Animals, people, or objects
      - Buildings, vehicles, or infrastructure
      - Food products that are not plants
      - Non-plant materials
      - Abstract or unclear images

      Return isDefinedCrop=true ONLY if the plant matches one of the supported crops listed above.
      Set identifiedPlant to the plant name you recognize (even if not in supported list).
    `;

    const validationResult = await model.generateContent([
      validationPrompt,
      {
        inlineData: {
          data: image,
          mimeType: mimeType,
        },
      },
    ]);

    const validationResponse = await validationResult.response;
    const validationText = validationResponse.text();

    // Parse validation response
    let validationData;
    try {
      const jsonMatch = validationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in validation response");
      }
    } catch (parseError) {
      console.error("Failed to parse validation response:", parseError);
      // Default to allowing the image if validation fails
      validationData = { isPlant: true, isDefinedCrop: true, reason: "Validation inconclusive" };
    }

    // If not a plant, reject the analysis
    if (!validationData.isPlant) {
      return NextResponse.json(
        {
          error: "Invalid image type",
          message: "Please upload an image of a plant or crop. The provided image does not appear to contain plant material.",
          reason: validationData.reason,
        },
        { status: 400 }
      );
    }

    // If it's a plant but not in our defined crop list, return unknown plant message
    if (validationData.isPlant && !validationData.isDefinedCrop) {
      return NextResponse.json(
        {
          error: "Unknown plant detected",
          message: "Unknown plant",
          identifiedPlant: validationData.identifiedPlant || "Unrecognized plant",
          reason: validationData.reason,
          supportedCrops: Object.keys(CROP_DISEASE_MAP),
        },
        { status: 400 }
      );
    }

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

      SUPPORTED CROPS AND DISEASES:
      You MUST identify the crop from this list and ONLY detect diseases specific to that crop:

      - Apple: Scab, Rust, Healthy leaf
      - Bell pepper: Leaf spot, Healthy leaf
      - Blueberry: Healthy leaf
      - Cherry: Healthy leaf
      - Corn: Gray leaf spot, Leaf blight, Rust, Healthy leaf
      - Peach: Healthy leaf
      - Potato: Early blight, Late blight, Healthy leaf
      - Raspberry: Healthy leaf
      - Soybean: Healthy leaf
      - Squash: Powdery mildew, Healthy leaf
      - Strawberry: Healthy leaf
      - Tomato: Early blight, Septoria leaf spot, Bacterial spot, Late blight, Mosaic virus, Yellow virus, Mold, Two spotted spider mites, Healthy leaf
      - Grape: Black rot, Healthy leaf

      IMPORTANT INSTRUCTIONS:
      1. First identify which plant/crop this is from the list above
      2. If the plant is healthy, set "detectedDisease" to "Healthy leaf"
      3. If diseased, ONLY use diseases from the specific list for that crop type
      4. Do NOT invent or use disease names not listed above
      5. Match the exact disease name format from the list (e.g., "Early blight", "Gray leaf spot")

      ANALYSIS REQUIRED:
      Analyze this crop/plant image considering the above farm context and current weather conditions.
      Consider how the current weather and local conditions might affect plant health and disease development.

      Provide your analysis in this EXACT JSON format:
      {
        "isHealthy": boolean (true if "Healthy leaf", false if disease detected),
        "detectedDisease": "string - use exact disease name from the list above, or 'Healthy leaf' if healthy",
        "plantType": "identified plant/crop type from the supported crops list",
        "confidence": number (0-100),
        "observations": "detailed observations about the plant's condition, considering current weather and farm conditions",
        "treatment": {
          "immediate": "immediate treatment recommendations specific to this farm's conditions (or 'No treatment needed' if healthy)",
          "prevention": "prevention measures considering the farm's climate and crops",
          "followUp": "follow-up care instructions tailored to the farmer's experience level"
        },
        "severity": "low/medium/high (or 'none' if healthy)",
        "environmentalFactors": "how current weather/climate affects this condition",
        "farmSpecificAdvice": "advice specific to this farm's crops and location"
      }

      Focus on:
      - Identifying the specific plant type from the supported crops list
      - Using ONLY the disease names specified for that crop type
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

    // Validate plant type and disease
    const plantType = analysisResult.plantType ?? "Unknown plant";
    const rawDisease = analysisResult.detectedDisease ?? "Healthy leaf";
    const validatedDisease = validateDiseaseForCrop(plantType, rawDisease);

    // Update isHealthy based on validated disease
    const isHealthy = validatedDisease === "Healthy leaf";

    // Ensure all required fields are present and add farm-specific info
    const validatedResult = {
      isHealthy: isHealthy,
      detectedDisease: validatedDisease,
      plantType: plantType,
      confidence: Math.min(100, Math.max(0, analysisResult.confidence ?? 70)),
      observations: analysisResult.observations ?? "Analysis completed",
      treatment: {
        immediate:
          analysisResult.treatment?.immediate ?? (isHealthy ? "No treatment needed" : "Monitor plant condition"),
        prevention:
          analysisResult.treatment?.prevention ?? "Maintain proper plant care",
        followUp:
          analysisResult.treatment?.followUp ??
          "Regular health checks recommended",
      },
      severity: isHealthy ? "none" : (analysisResult.severity ?? "low"),
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
      whatsappSent: false,
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
            confidence: validatedResult.confidence,
            observations: validatedResult.observations,
            treatment: validatedResult.treatment,
            farmName: farmName,
            userName: userName,
            environmentalFactors: validatedResult.environmentalFactors
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

    if (!location || !OPENWEATHER_API_KEY) {
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
