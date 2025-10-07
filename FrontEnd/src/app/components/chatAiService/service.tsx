"use client";

import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from "jspdf";
import styles from "./style/service.module.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Farmer {
  id: string;
  name: string;
  email: string;
  farmName: string;
  location: string;
  farmSize: number;
  cropTypes: string[];
  experienceYears: number;
}

export default function CropAdvisorChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your CropGuard AI Advisor. I'm here to help you with everything about growing and caring for your crops - from planting to harvest. Ask me anything about crop care, watering schedules, pest control, disease prevention, soil management, or any other farming advice you need!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyBxM9lp3-3_mifpdppt66AlhWAPcLUd90k");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const cropContext = `
        You are an expert agricultural advisor specializing in crop disease detection and farm management for CropGuard AI.

        ${currentUser ? `
        FARMER PROFILE:
        - Name: ${currentUser.name}
        - Farm: ${currentUser.farmName}
        - Location: ${currentUser.location}
        - Farm Size: ${currentUser.farmSize} hectares
        - Crops: ${currentUser.cropTypes.join(", ")}
        - Experience: ${currentUser.experienceYears} years
        ` : ''}

        YOUR EXPERTISE INCLUDES:
        - Crop disease identification and treatment (Apple, Bell pepper, Blueberry, Cherry, Corn, Peach, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato, Grape)
        - Pest control and prevention
        - Soil health and nutrition management
        - Irrigation and watering schedules
        - Planting calendars and crop rotation
        - Harvesting techniques and timing
        - Weather-based farming advice
        - Organic and sustainable farming practices
        - Fertilizer recommendations
        - Crop-specific care instructions

        INSTRUCTIONS:
        - Provide practical, actionable advice for farmers
        - Use simple, clear language
        - Include specific measurements and timings when relevant
        - Prioritize sustainable and cost-effective solutions
        - Consider South African farming conditions
        - If discussing diseases, mention symptoms, causes, and treatments
        - Always be supportive and encouraging
        - Provide step-by-step guidance when needed
      `;

      const prompt = `${cropContext}\n\nFarmer's question: ${userMessage}\n\nProvide helpful agricultural advice:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating response:", error);
      return `I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment. In the meantime, you can:

• Check your crop analysis history in the dashboard
• Schedule a crop scan
• Review your farm activities

I'll be back to help you shortly!`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const botResponse = await generateResponse(userMessage.text);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      speakText(botResponse);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize for the technical difficulty. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = "en-US";

      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.includes("en-") &&
          voice.name.toLowerCase().includes("female")
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        let errorMessage = "Speech recognition error. Please try again.";
        if (event.error === "not-allowed") {
          errorMessage = "Microphone access denied. Please enable microphone permissions.";
        } else if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try again.";
        }
        alert(errorMessage);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(22, 163, 74); // Green
    pdf.text("CropGuard AI - Crop Advisor Chat", 20, yPosition);

    yPosition += 25;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    pdf.text(`Farmer: ${currentUser?.name || 'Unknown'}`, 20, yPosition + 7);
    pdf.text(`Farm: ${currentUser?.farmName || 'Unknown'}`, 20, yPosition + 14);

    yPosition += 30;

    // Separator
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(22, 163, 74);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    messages.forEach((message, index) => {
      const sender = message.sender === "user" ? "You" : "CropGuard AI";
      const time = message.timestamp.toLocaleTimeString();

      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      // Message header
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`${sender} - ${time}`, 20, yPosition);

      yPosition += 12;

      // Message content
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);

      const splitText = pdf.splitTextToSize(message.text, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);

      yPosition += splitText.length * 4 + 15;

      if (index < messages.length - 1) {
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
      }
    });

    // Footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text("CropGuard AI - Your Agricultural Assistant", 20, footerY);

    const filename = `cropguard-chat-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
  };

  const quickActions = [
    {
      text: "How do I identify and treat early blight in tomatoes?",
      label: "Disease Treatment",
      desc: "Get help with crop diseases",
    },
    {
      text: "What's the best watering schedule for my crops?",
      label: "Watering Guide",
      desc: "Learn optimal irrigation practices",
    },
    {
      text: "When is the best time to plant corn in South Africa?",
      label: "Planting Calendar",
      desc: "Seasonal planting advice",
    },
    {
      text: "How can I improve my soil quality naturally?",
      label: "Soil Health",
      desc: "Organic soil management tips",
    },
    {
      text: "What are the signs of nutrient deficiency in my crops?",
      label: "Nutrient Guide",
      desc: "Identify and fix deficiencies",
    },
    {
      text: "How do I protect my crops from pests organically?",
      label: "Pest Control",
      desc: "Natural pest management",
    },
  ];

  return (
    <>
      <Head>
        <title>CropGuard AI Advisor - Agricultural Chat Assistant</title>
        <meta
          name="description"
          content="AI-powered agricultural advisor for crop disease management and farm optimization"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.logo}>
                <span>🌱</span>
              </div>
              <div className={styles.headerText}>
                <h1>CropGuard AI Advisor</h1>
                <p>Powered by Gemini 2.0 • Expert Agricultural Guidance</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={downloadPDF}
                className={styles.downloadBtn}
                title="Download conversation as PDF"
              >
                <svg
                  className={styles.icon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className={styles.mainContent}>
          <div className={styles.chatContainer}>
            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.sender === "user"
                      ? styles.userMessage
                      : styles.botMessage
                  }`}
                >
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{message.text}</p>
                    <p className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.botMessage}`}>
                  <div className={styles.messageBubble}>
                    <div className={styles.typingIndicator}>
                      <div className={styles.typingDots}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                      </div>
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !isLoading && handleSendMessage()
                  }
                  placeholder="Ask me about crops, diseases, pests, soil, or farming techniques..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={startListening}
                  disabled={isListening || isLoading}
                  className={`${styles.voiceBtn} ${
                    isListening ? styles.listening : ""
                  }`}
                  title={isListening ? "Listening..." : "Click to speak"}
                >
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={styles.sendBtn}
                  title="Send message"
                >
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>

              <div className={styles.footerText}>
                <p>
                  Powered by Google Gemini 2.0 • Expert Agricultural Advice
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setInput(action.text)}
                className={styles.quickActionBtn}
                disabled={isLoading}
              >
                <div className={styles.quickActionTitle}>{action.label}</div>
                <div className={styles.quickActionDesc}>{action.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
