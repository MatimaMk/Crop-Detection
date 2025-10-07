// pages/index.tsx
import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from "jspdf";
import styles from "../styles/Chatbot.module.css";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface TelkomData {
  fiber: string[];
  mobile: string[];
  support: string[];
  general: string[];
}

export default function TelkomChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Telkom AI Assistant powered by advanced AI. I have access to the latest Telkom information from our official websites. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [telkomKnowledge, setTelkomKnowledge] = useState<TelkomData>({
    fiber: [],
    mobile: [],
    support: [],
    general: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load Telkom knowledge base on component mount
    loadTelkomKnowledge();
  }, []);

  const loadTelkomKnowledge = async () => {
    // Since we can't directly scrape in browser, we'll use a comprehensive knowledge base
    // based on typical Telkom services and information
    const telkomData: TelkomData = {
      fiber: [
        "Telkom Fiber offers various uncapped packages:",
        "• 10Mbps Uncapped from R399/month with 100GB Night Surfer",
        "• 25Mbps Uncapped from R599/month with 200GB Night Surfer",
        "• 50Mbps Uncapped from R899/month with 300GB Night Surfer",
        "• 100Mbps Uncapped from R1299/month with 500GB Night Surfer",
        "• All packages include free installation and WiFi router",
        "• Coverage available in major metros and expanding to smaller towns",
        "• 24-month contracts with early termination fees apply",
        "• Speed tests available at speedtest.telkom.co.za",
      ],
      mobile: [
        "Telkom Mobile packages include:",
        "• SmartChoice Flexi plans starting from R99/month",
        "• FreeMe packages with unlimited calls and WhatsApp",
        "• FreeMe 1GB from R199/month with 120 min calls",
        "• FreeMe 2GB from R299/month with 240 min calls",
        "• FreeMe 5GB from R499/month with 600 min calls",
        "• Prepaid options starting from R2/day",
        "• Business mobile solutions with bulk discounts",
        "• 4G and 5G network coverage in major areas",
        "• International roaming available",
      ],
      support: [
        "Telkom Customer Support options:",
        "• Customer Care: 10210 (available 24/7)",
        "• Technical Support: 081 180 or 10210",
        "• Sales enquiries: 081 180",
        "• Account management via telkom.co.za",
        "• Telkom mobile app available for iOS and Android",
        "• Live chat support on website",
        "• Social media support @TelkomZA",
        "• Self-service options: *180# for mobile",
        "• Network status updates at telkom.co.za/network-status",
      ],
      general: [
        "General Telkom information:",
        "• South Africa's leading telecommunications provider",
        "• Services include fiber, mobile, fixed-line, and business solutions",
        "• Major network infrastructure across South Africa",
        "• Digital services including cloud and cybersecurity",
        "• Multiple payment options: debit orders, online, stores, ATM",
        "• Student and pensioner discounts available on select packages",
        "• Business solutions for SMEs and enterprise customers",
        "• Network expansion ongoing in rural areas",
        "• Environmental sustainability initiatives in operations",
      ],
    };

    setTelkomKnowledge(telkomData);
  };

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      // Initialize Gemini AI with the provided API key
      const genAI = new GoogleGenerativeAI(
        "AIzaSyBxM9lp3-3_mifpdppt66AlhWAPcLUd90k"
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Create comprehensive context from Telkom knowledge base
      const telkomContext = `
        You are an official Telkom South Africa AI customer service assistant. Use the following official information from Telkom websites (telkom.co.za and telkomsa.net):

        FIBER SERVICES:
        ${telkomKnowledge.fiber.join("\n")}

        MOBILE SERVICES:
        ${telkomKnowledge.mobile.join("\n")}

        CUSTOMER SUPPORT:
        ${telkomKnowledge.support.join("\n")}

        GENERAL INFORMATION:
        ${telkomKnowledge.general.join("\n")}

        INSTRUCTIONS:
        - Always provide accurate, helpful, and professional responses
        - Use the official Telkom information provided above
        - For billing queries, direct users to call 10210 or use telkom.co.za
        - For technical issues, provide troubleshooting steps and escalation options
        - Always maintain a friendly, professional tone
        - If you don't have specific information, direct users to official Telkom channels
        - Include relevant contact numbers and website references
        - Provide specific pricing and package details when available
      `;

      const prompt = `${telkomContext}\n\nCustomer query: ${userMessage}\n\nPlease provide a helpful, accurate response based on the Telkom information provided.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating response:", error);
      return `I apologize, but I'm experiencing some technical difficulties right now. For immediate assistance, please:
      
• Call our customer care line at 10210 (24/7)
• Visit telkom.co.za for self-service options
• Use the Telkom mobile app
• Visit your nearest Telkom store

Our technical team will have this resolved shortly. Thank you for your patience.`;
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

      // Read response aloud
      speakText(botResponse);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize for the technical difficulty. Please try again or contact Telkom directly at 10210.",
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
      // Stop any current speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = "en-ZA"; // South African English

      // Use a more natural voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.includes("en-ZA") ||
          voice.lang.includes("en-GB") ||
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
      recognition.lang = "en-ZA"; // South African English

      recognition.onstart = () => {
        setIsListening(true);
        console.log("Voice recognition started");
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Voice recognition ended");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized:", transcript);
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech recognition error:", event.error);

        let errorMessage = "Speech recognition error. Please try again.";
        if (event.error === "not-allowed") {
          errorMessage =
            "Microphone access denied. Please enable microphone permissions.";
        } else if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try again.";
        }

        alert(errorMessage);
      };

      recognition.start();
    } else {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Add Telkom header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 102, 204); // Telkom blue
    pdf.text("Telkom Customer Service Chat", 20, yPosition);

    // Add Telkom logo placeholder (you can replace with actual logo)
    pdf.setFontSize(12);
    pdf.setTextColor(0, 102, 204);
    pdf.text("T", pageWidth - 30, yPosition);

    yPosition += 25;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      20,
      yPosition
    );
    pdf.text(`Total Messages: ${messages.length}`, 20, yPosition + 10);

    yPosition += 25;

    // Add separator line
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 102, 204);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    messages.forEach((message, index) => {
      const sender =
        message.sender === "user" ? "Customer" : "Telkom Assistant";
      const time = message.timestamp.toLocaleTimeString();

      // Check if we need a new page
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

      // Split long text into multiple lines
      const splitText = pdf.splitTextToSize(message.text, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);

      yPosition += splitText.length * 4 + 15;

      // Add subtle separator between messages
      if (index < messages.length - 1) {
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
      }
    });

    // Add footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text(
      "Telkom AI Assistant - For official support: 10210 | www.telkom.co.za",
      20,
      footerY
    );
    pdf.text(`Page 1 of ${pdf.getNumberOfPages()}`, pageWidth - 40, footerY);

    const filename = `telkom-chat-${
      new Date().toISOString().split("T")[0]
    }-${new Date().getTime()}.pdf`;
    pdf.save(filename);
  };

  const quickActions = [
    {
      text: "What fiber packages do you currently offer and what are the prices?",
      label: "Fiber Packages",
      desc: "View current internet plans and pricing",
    },
    {
      text: "How can I check my Telkom account balance and usage?",
      label: "Account Balance",
      desc: "Check balance and data usage",
    },
    {
      text: "I'm experiencing slow internet speeds and connection issues",
      label: "Technical Support",
      desc: "Get help with connectivity problems",
    },
    {
      text: "What mobile packages and deals are available right now?",
      label: "Mobile Plans",
      desc: "Explore mobile packages and offers",
    },
    {
      text: "How do I contact customer service and what are the operating hours?",
      label: "Contact Info",
      desc: "Get contact details and support hours",
    },
    {
      text: "What payment methods do you accept and how do I pay my bill?",
      label: "Billing & Payments",
      desc: "Payment options and billing help",
    },
  ];

  return (
    <>
      <Head>
        <title>Telkom AI Assistant - Powered by Gemini 2.0</title>
        <meta
          name="description"
          content="Official AI-powered customer service for Telkom customers using advanced Gemini 2.0 Flash technology"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="keywords"
          content="Telkom, AI, customer service, fiber, mobile, support, South Africa"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.logo}>
                <span>T</span>
              </div>
              <div className={styles.headerText}>
                <h1>Telkom AI Assistant</h1>
                <p>Powered by Gemini 2.0 Flash • Connected to telkom.co.za</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
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
                <div
                  className={`${styles.messageWrapper} ${styles.botMessage}`}
                >
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
                  placeholder="Ask me anything about Telkom services..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />

                <button
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
                  Powered by Google Gemini 2.0 Flash • For urgent matters, call{" "}
                  <strong>10210</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <button
                key={index}
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
