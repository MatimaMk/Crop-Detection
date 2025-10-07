"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RemindersPanel from "../components/Reminders/RemindersPanel";

export default function RemindersPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
    } else {
      // Redirect to login if no user data
      router.push("/");
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fffe 0%, #f0fdf4 50%, #ecfdf5 100%)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔔</div>
          <p style={{ color: "#6b7280" }}>Loading reminders...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fffe 0%, #f0fdf4 50%, #ecfdf5 100%)"
    }}>
      <nav style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem 2rem"
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🌱</span>
            <span style={{ fontWeight: "700", fontSize: "1.25rem", color: "#111827" }}>
              CropGuard AI
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "0.5rem 1rem",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </nav>
      <RemindersPanel userId={userId} />
    </div>
  );
}
