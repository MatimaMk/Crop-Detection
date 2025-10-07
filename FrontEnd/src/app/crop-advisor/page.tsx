"use client";

import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import jsPDF from "jspdf";
import styles from "./crop-advisor.module.css";
import { Leaf, Download, Mic, Send, ArrowLeft, Droplets, Sun, Bug, Sprout, VolumeX } from "lucide-react";

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

export default function CropAdvisor() {
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
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    } else {
      // Redirect to login if no user data
      window.location.href = "/";
    }
  }, []);

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch("/api/crop-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: currentUser?.id,
          farmName: currentUser?.farmName,
          userName: currentUser?.name,
          userLocation: currentUser?.location,
          farmSize: currentUser?.farmSize,
          cropTypes: currentUser?.cropTypes,
          experienceYears: currentUser?.experienceYears,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from advisor");
      }

      const data = await response.json();
      return data.response;
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

      // Clean markdown formatting (remove ** for bold)
      const cleanedResponse = botResponse.replace(/\*\*/g, '');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Optional: Read response aloud
      if (window.speechSynthesis) {
        speakText(cleanedResponse);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize for the technical difficulty. Please try asking your question again.",
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

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
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
        console.error("Speech recognition error:", event.error);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(16, 185, 129); // Green color
    pdf.text("CropGuard AI Advisor Chat", 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Farm: ${currentUser?.farmName || "N/A"}`, 20, yPosition);
    pdf.text(`Farmer: ${currentUser?.name || "N/A"}`, 20, yPosition + 7);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition + 14);

    yPosition += 25;

    // Separator
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(16, 185, 129);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    messages.forEach((message, index) => {
      const sender = message.sender === "user" ? "You" : "Crop Advisor";
      const time = message.timestamp.toLocaleTimeString();

      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`${sender} - ${time}`, 20, yPosition);

      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);

      const splitText = pdf.splitTextToSize(message.text, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);

      yPosition += splitText.length * 5 + 10;
    });

    const filename = `crop-advisor-chat-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
  };

  const goBack = () => {
    window.location.href = "/dashboard";
  };

  const quickActions = [
    {
      text: "How do I properly water my tomatoes during different growth stages?",
      label: "Watering Guide",
      icon: <Droplets className="w-4 h-4" />,
    },
    {
      text: "What are the best practices for preventing diseases in my crops?",
      label: "Disease Prevention",
      icon: <Bug className="w-4 h-4" />,
    },
    {
      text: "When is the best time to plant and harvest my crops?",
      label: "Planting Schedule",
      icon: <Sprout className="w-4 h-4" />,
    },
    {
      text: "How can I improve soil health for better crop yield?",
      label: "Soil Management",
      icon: <Sun className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <Head>
        <title>Crop Advisor - CropGuard AI</title>
        <meta
          name="description"
          content="Get expert advice on crop cultivation, care, and lifecycle management"
        />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={goBack} className={styles.backButton}>
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className={styles.headerCenter}>
              <div className={styles.logo}>
                <Leaf className="w-6 h-6" />
              </div>
              <div className={styles.headerText}>
                <h1>Crop Advisor</h1>
                <p>
                  {currentUser?.farmName ? `${currentUser.farmName} • ` : ""}Expert guidance for your crops
                </p>
              </div>
            </div>
            <button onClick={downloadPDF} className={styles.downloadBtn} title="Download chat">
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.chatContainer}>
            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.sender === "user" ? styles.userMessage : styles.botMessage
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
                      <span>Analyzing...</span>
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
                  placeholder="Ask about crop care, watering, diseases, planting..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className={styles.stopSpeakBtn}
                    title="Stop reading"
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={startListening}
                  disabled={isListening || isLoading}
                  className={`${styles.voiceBtn} ${isListening ? styles.listening : ""}`}
                  title={isListening ? "Listening..." : "Voice input"}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={styles.sendBtn}
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.footerText}>
                <p>Powered by AI • Expert crop lifecycle advice for your farm</p>
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
                <div className={styles.quickActionIcon}>{action.icon}</div>
                <div className={styles.quickActionLabel}>{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
