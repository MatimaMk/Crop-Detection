"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Mail, MessageSquare, Clock, Moon, CheckCircle, Save } from "lucide-react";
import styles from "./settings.module.css";

interface NotificationPreferences {
  whatsapp: {
    enabled: boolean;
    diseaseAlerts: boolean;
    reminders: boolean;
    weatherAlerts: boolean;
  };
  email: {
    enabled: boolean;
    diseaseAlerts: boolean;
    weeklyReports: boolean;
    tips: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationSettings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsapp: {
      enabled: true,
      diseaseAlerts: true,
      reminders: true,
      weatherAlerts: true,
    },
    email: {
      enabled: false,
      diseaseAlerts: false,
      weeklyReports: false,
      tips: false,
    },
    inApp: {
      enabled: true,
      sound: true,
      vibration: false,
    },
    quietHours: {
      enabled: false,
      startTime: "22:00",
      endTime: "07:00",
    },
  });

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      setUserName(user.name);

      // Load saved preferences
      const savedPrefs = localStorage.getItem(`notificationPreferences_${user.id}`);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } else {
      router.push("/");
      return;
    }
    setIsLoading(false);
  }, [router]);

  const handleToggle = (category: keyof NotificationPreferences, field: string) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field as keyof typeof prev[typeof category]],
      },
    }));
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!userId) return;

    setIsSaving(true);

    // Save to localStorage
    localStorage.setItem(`notificationPreferences_${userId}`, JSON.stringify(preferences));

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => router.push("/dashboard")} className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div className={styles.headerTitle}>
          <Bell size={24} />
          <h1>Notification Settings</h1>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className={styles.successBanner}>
          <CheckCircle size={20} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.intro}>
          <h2>Welcome, {userName}!</h2>
          <p>Customize how you receive notifications and alerts from CropGuard AI</p>
        </div>

        {/* WhatsApp Notifications */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <MessageSquare size={24} className={styles.iconWhatsapp} />
            <div>
              <h3>WhatsApp Notifications</h3>
              <p>Receive alerts via WhatsApp messages</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.whatsapp.enabled}
                onChange={() => handleToggle("whatsapp", "enabled")}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {preferences.whatsapp.enabled && (
            <div className={styles.subOptions}>
              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Disease Alerts</strong>
                  <span>Get notified immediately when diseases are detected</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp.diseaseAlerts}
                    onChange={() => handleToggle("whatsapp", "diseaseAlerts")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Task Reminders</strong>
                  <span>Reminders for scheduled farming activities</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp.reminders}
                    onChange={() => handleToggle("whatsapp", "reminders")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Weather Alerts</strong>
                  <span>Important weather warnings for your crops</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp.weatherAlerts}
                    onChange={() => handleToggle("whatsapp", "weatherAlerts")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* Email Notifications */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Mail size={24} className={styles.iconEmail} />
            <div>
              <h3>Email Notifications</h3>
              <p>Receive updates and reports via email</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.email.enabled}
                onChange={() => handleToggle("email", "enabled")}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {preferences.email.enabled && (
            <div className={styles.subOptions}>
              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Disease Alerts</strong>
                  <span>Email summaries of detected crop diseases</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.email.diseaseAlerts}
                    onChange={() => handleToggle("email", "diseaseAlerts")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Weekly Reports</strong>
                  <span>Comprehensive weekly farm health reports</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.email.weeklyReports}
                    onChange={() => handleToggle("email", "weeklyReports")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Farming Tips</strong>
                  <span>Seasonal advice and best practices</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.email.tips}
                    onChange={() => handleToggle("email", "tips")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* In-App Notifications */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={24} className={styles.iconInApp} />
            <div>
              <h3>In-App Notifications</h3>
              <p>Alerts within the CropGuard AI app</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.inApp.enabled}
                onChange={() => handleToggle("inApp", "enabled")}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {preferences.inApp.enabled && (
            <div className={styles.subOptions}>
              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Notification Sound</strong>
                  <span>Play sound for new notifications</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.inApp.sound}
                    onChange={() => handleToggle("inApp", "sound")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.option}>
                <div className={styles.optionInfo}>
                  <strong>Vibration</strong>
                  <span>Vibrate on mobile devices</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={preferences.inApp.vibration}
                    onChange={() => handleToggle("inApp", "vibration")}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* Quiet Hours */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Moon size={24} className={styles.iconQuiet} />
            <div>
              <h3>Quiet Hours</h3>
              <p>Pause non-urgent notifications during specific hours</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={() => handleToggle("quietHours", "enabled")}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {preferences.quietHours.enabled && (
            <div className={styles.subOptions}>
              <div className={styles.timeRange}>
                <div className={styles.timeInput}>
                  <Clock size={20} />
                  <label>
                    <span>Start Time</span>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => handleTimeChange("startTime", e.target.value)}
                    />
                  </label>
                </div>
                <span className={styles.timeSeparator}>to</span>
                <div className={styles.timeInput}>
                  <Clock size={20} />
                  <label>
                    <span>End Time</span>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => handleTimeChange("endTime", e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <p className={styles.quietNote}>
                <strong>Note:</strong> Critical disease alerts will still be delivered during quiet hours.
              </p>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className={styles.saveSection}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={styles.saveButton}
          >
            {isSaving ? (
              <>
                <div className={styles.miniSpinner}></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
