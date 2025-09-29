import { NextRequest, NextResponse } from "next/server";

const accountSid = 'AC5c62df0d54b603eb0e268a03d3188502';
const authToken = '6464959e1f994fb2b6340e7544751d48';

export async function POST(request: NextRequest) {
  try {
    const {
      phoneNumber,
      diseaseName,
      plantType,
      severity,
      treatment
    } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format phone number: replace leading 0 with +27 for South African numbers
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+27' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+27' + formattedPhone;
    }

    // Dynamically import twilio (only on server)
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Format the diagnosis content for WhatsApp
    const diagnosisContent = JSON.stringify({
      "1": diseaseName || "Disease detected",
      "2": `Plant: ${plantType || "Unknown"}`,
      "3": `Severity: ${severity || "Unknown"}`,
      "4": treatment?.immediate || "Consult an expert"
    });

    // Send WhatsApp message
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      contentSid: 'HX350d429d32e64a552466cafecbe95f3c',
      contentVariables: diagnosisContent,
      to: `whatsapp:${formattedPhone}`
    });

    console.log(`WhatsApp notification sent: ${message.sid}`);

    return NextResponse.json({
      success: true,
      messageSid: message.sid,
      message: "WhatsApp notification sent successfully"
    });

  } catch (error) {
    console.error("WhatsApp notification error:", error);

    return NextResponse.json(
      {
        error: "Failed to send WhatsApp notification",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}