"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Dynamically import the TelkomChatbot component to avoid SSR issues
const TelkomChatbot = dynamic(
  () => import("../../components/chatAiService/service"),
  { ssr: false }
);

export default function AIChatPage() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Back to Dashboard Button */}
      <button
        onClick={handleBackToDashboard}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#0052a3";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "#0066cc";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        title="Back to Dashboard"
      >
        <ArrowLeft size={18} />
        <span>Dashboard</span>
      </button>

      {/* AI Chatbot Component */}
      <TelkomChatbot />
    </div>
  );
}