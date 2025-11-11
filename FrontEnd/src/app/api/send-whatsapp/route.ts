import { NextRequest, NextResponse } from "next/server";

const accountSid = "AC5c62df0d54b603eb0e268a03d3188502";
const authToken = "381f856ddec8cb74a5dade09a59311c7";

export async function POST(request: NextRequest) {
  try {
    const {
      phoneNumber,
      diseaseName,
      plantType,
      severity,
      confidence,
      observations,
      treatment,
      farmName,
      userName,
      environmentalFactors,
    } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format phone number: replace leading 0 with +27 for South African numbers
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+27" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+27" + formattedPhone;
    }

    // Dynamically import twilio (only on server)
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    // Helper function to truncate text
    const truncate = (text: string, maxLength: number) => {
      if (!text) return "";
      return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
    };

    // Create concise message content (under 1600 chars)
    let messageBody = `🌱 CropGuard AI Alert\n\n`;
    messageBody += `👤 ${userName || "Farmer"} | 🏡 ${farmName || "Farm"}\n\n`;
    messageBody += `🌿 Plant: ${plantType || "Unknown"}\n`;
    messageBody += `⚠️ Disease: ${diseaseName || "Unknown"}\n`;
    messageBody += `📊 Severity: ${severity?.toUpperCase() || "N/A"}\n`;
    messageBody += `🎯 Confidence: ${
      confidence ? Math.round(confidence) + "%" : "N/A"
    }\n\n`;

    if (observations) {
      messageBody += `🔬 Observations:\n${truncate(observations, 200)}\n\n`;
    }

    messageBody += `💊 TREATMENT\n\n`;

    if (treatment?.immediate) {
      messageBody += `⚡ Immediate:\n${truncate(treatment.immediate, 250)}\n\n`;
    }

    if (treatment?.prevention) {
      messageBody += `🛡️ Prevention:\n${truncate(
        treatment.prevention,
        250
      )}\n\n`;
    }

    if (treatment?.followUp) {
      messageBody += `📋 Follow-up:\n${truncate(treatment.followUp, 200)}\n\n`;
    }

    if (environmentalFactors) {
      messageBody += `🌤️ Environment:\n${truncate(
        environmentalFactors,
        150
      )}\n\n`;
    }

    messageBody += `📱 Check dashboard for full details.\n`;
    messageBody += `🤖 CropGuard AI`;

    // Ensure message is under 1600 characters
    if (messageBody.length > 1600) {
      messageBody = messageBody.substring(0, 1597) + "...";
    }

    // Send WhatsApp message
    const message = await client.messages.create({
      from: "whatsapp:+14155238886",
      body: messageBody,
      to: `whatsapp:${formattedPhone}`,
    });

    console.log(`WhatsApp notification sent: ${message.sid}`);

    return NextResponse.json({
      success: true,
      messageSid: message.sid,
      message: "WhatsApp notification sent successfully",
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);

    return NextResponse.json(
      {
        error: "Failed to send WhatsApp notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
