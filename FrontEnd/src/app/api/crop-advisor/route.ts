import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyDrxyuVNOH80GjD53qJiKrGHSvcwrlQ5D0");

// Supported crops
const SUPPORTED_CROPS = [
  "Apple",
  "Bell pepper",
  "Blueberry",
  "Cherry",
  "Corn",
  "Peach",
  "Potato",
  "Raspberry",
  "Soybean",
  "Squash",
  "Strawberry",
  "Tomato",
  "Grape",
];

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      userId,
      farmName,
      userName,
      userLocation,
      farmSize,
      cropTypes,
      experienceYears,
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get the generative model of flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create comprehensive crop advisor prompt the promt
    const prompt = `
      You are an expert agricultural advisor specializing in crop cultivation and lifecycle management. You are providing personalized advice to ${userName} from ${farmName} farm.

      FARMER CONTEXT:
      - Farm Name: ${farmName || "Unknown"}
      - Location: ${userLocation || "Unknown"}
      - Farm Size: ${farmSize || "Unknown"} acres
      - Farmer's Experience: ${experienceYears || "Unknown"} years
      - Crops Grown: ${cropTypes?.join(", ") || "Various crops"}

      SUPPORTED CROPS:
      ${SUPPORTED_CROPS.join(", ")}

      YOUR EXPERTISE INCLUDES:
      1. PLANTING & SEEDING:
         - Best planting times for each crop
         - Seed depth and spacing
         - Soil preparation requirements
         - Germination conditions

      2. WATERING & IRRIGATION:
         - Watering schedules for different growth stages
         - Irrigation methods (drip, sprinkler, furrow)
         - Water requirements per crop
         - Signs of over/under-watering

      3. SOIL MANAGEMENT:
         - Soil pH requirements for each crop
         - Nutrient management and fertilization
         - Organic matter and composting
         - Soil testing and amendments

      4. PEST & DISEASE CONTROL:
         - Common pests for each crop type
         - Natural and chemical pest control methods
         - Disease prevention strategies
         - Integrated Pest Management (IPM)

      5. GROWTH STAGES:
         - Vegetative growth care
         - Flowering and fruit set
         - Ripening and maturation
         - Specific care for each stage

      6. HARVESTING:
         - Optimal harvest timing
         - Harvest methods
         - Post-harvest handling
         - Storage recommendations

      7. SEASONAL PLANNING:
         - Crop rotation strategies
         - Companion planting
         - Cover crops
         - Multi-season planning

      8. WEATHER & CLIMATE:
         - Weather impact on crops
         - Frost protection
         - Heat stress management
         - Drought management

      9. SUSTAINABLE PRACTICES:
         - Organic farming methods
         - Water conservation
         - Biodiversity enhancement
         - Environmental protection

      INSTRUCTIONS:
      - Provide practical, actionable advice specific to the farmer's context
      - Reference the farmer's experience level when explaining concepts
      - Include specific measurements, timings, and recommendations
      - Consider the farm's location and climate when relevant
      - If discussing a specific crop, ensure it's from the supported crops list
      - Use clear, concise language appropriate for farmers
      - Include warnings about common mistakes
      - Suggest follow-up actions or monitoring
      - Be encouraging and supportive
      - If asked about crops not in the supported list, politely redirect to supported crops

      FARMER'S QUESTION:
      ${message}

      Provide a comprehensive, helpful response that addresses their question while considering their farm context.
    `;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Crop advisor error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate advice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
