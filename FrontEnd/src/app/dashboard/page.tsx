"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Bell,
  Settings,
  Camera,
  Calendar,
  Droplets,
  Sun,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Activity,
  PlusCircle,
  MessageCircle,
  Search,
  Filter,
  X,
  User,
  Edit,
  Save,
  Map,
  Clock,
  MapPin as LocationIcon,
  TrendingDown,
  Minus,
  Download,
  PieChart,
  Sprout,
  Scissors,
  Truck,
  Zap,
  Bug,
} from "lucide-react";
import styles from "./dashboard.module.css";
import { CropDataManager } from "../utils/cropDataManager";

interface Farmer {
  id: string;
  name: string;
  email: string;
  password: string;
  farmName: string;
  location: string;
  farmSize: number;
  cropTypes: string[];
  experienceYears: number;
  phone: string;
}

interface CropData {
  cropType: string;
  healthScore: number;
  lastScanned: string;
  diseaseDetected: boolean;
  area: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  sunlight: number;
  description?: string;
  windSpeed?: number;
  pressure?: number;
  location?: string;
  country?: string;
  icon?: string;
  visibility?: number;
}

interface NearbyFarmer {
  id: string;
  name: string;
  distance: number;
  cropTypes: string[];
  status: "online" | "offline";
}

interface FarmActivity {
  id: string;
  activityType:
    | "scan"
    | "watering"
    | "fertilizing"
    | "harvesting"
    | "planting"
    | "pest_control"
    | "pruning"
    | "maintenance";
  cropType: string;
  scheduledDate: string;
  scheduledTime: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  status: "pending" | "completed" | "overdue" | "cancelled";
  reminder?: boolean;
  priority: "low" | "medium" | "high";
  estimatedDuration?: number; // in minutes
  weather_dependent?: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  type:
    | "scan_scheduled"
    | "scan_reminder"
    | "scan_completed"
    | "disease_detected"
    | "weather_alert";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedScanId?: string;
}

interface MonthlyActivityData {
  month: string;
  scans: number;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Farmer | null>(null);

  // Location search states
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Data states - will be loaded from localStorage
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    sunlight: 0,
  });
  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmer[]>([]);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setProfileForm(user);

      // Load or initialize user-specific data
      loadUserData(user.id);

      // Load weather data from API for user's location
      loadWeatherData(user.location, user.id);
    } else {
      // Redirect to login if no user data
      window.location.href = "/";
    }

    // Add click outside handler for location suggestions
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-location-container]")) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if ((window as any).locationSearchTimeout) {
        clearTimeout((window as any).locationSearchTimeout);
      }
    };
  }, []);

  const loadWeatherData = async (location: string, userId: string) => {
    try {
      const response = await fetch(
        `/api/weather?location=${encodeURIComponent(location)}`
      );

      if (response.ok) {
        const weatherData = await response.json();
        setWeatherData(weatherData);
        // Cache for 1 hour
        const cacheData = {
          data: weatherData,
          timestamp: Date.now(),
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        };
        localStorage.setItem(`weather_${userId}`, JSON.stringify(cacheData));
      } else {
        // Use cached data if API fails
        const cachedWeather = localStorage.getItem(`weather_${userId}`);
        if (cachedWeather) {
          const cache = JSON.parse(cachedWeather);
          if (cache.expires > Date.now()) {
            setWeatherData(cache.data);
            return;
          }
        }

        // Fallback weather data
        setWeatherData({
          temperature: 22,
          humidity: 60,
          rainfall: 0,
          sunlight: 8,
          description: "Weather data unavailable",
          location: location,
        });
      }
    } catch (error) {
      console.warn("Failed to load weather data:", error);

      // Try cached data first
      const cachedWeather = localStorage.getItem(`weather_${userId}`);
      if (cachedWeather) {
        const cache = JSON.parse(cachedWeather);
        if (cache.expires > Date.now()) {
          setWeatherData(cache.data);
          return;
        }
      }

      // Final fallback
      setWeatherData({
        temperature: 22,
        humidity: 60,
        rainfall: 0,
        sunlight: 8,
        description: "Weather data unavailable",
        location: location,
      });
    }
  };

  const loadUserData = (userId: string) => {
    // Load real crop analysis data using CropDataManager - NO DUMMY DATA
    const realCropData = CropDataManager.generateCropDataForDashboard(userId);

    if (realCropData.length > 0) {
      // Convert to dashboard format
      const dashboardCropData = realCropData.map((crop) => ({
        cropType: crop.cropType,
        healthScore: crop.healthScore,
        lastScanned: crop.lastScanned,
        diseaseDetected: crop.diseaseDetected,
        area: crop.area,
        scanCount: crop.scanCount,
        trend: crop.trend,
      }));
      setCropData(dashboardCropData);
    } else {
      // No analysis data exists yet - show empty state
      setCropData([]);
    }

    // Load farm activities
    const savedActivities = localStorage.getItem(`farmActivities_${userId}`);
    if (savedActivities) {
      setFarmActivities(JSON.parse(savedActivities));
    }

    // Load notifications
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    // Load nearby farmers from saved data only - NO DEFAULT DUMMY DATA
    const savedFarmers = localStorage.getItem("nearbyFarmers");
    if (savedFarmers) {
      setNearbyFarmers(JSON.parse(savedFarmers));
    } else {
      // Start with empty list - no dummy farmers
      setNearbyFarmers([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  // Location search functions
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setIsLoadingLocations(true);
    try {
      const response = await fetch(
        `/api/location?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data.locations || []);
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } catch (error) {
      console.error("Failed to search locations:", error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Handle location input change with debouncing
  const handleLocationChange = (value: string) => {
    if (profileForm) {
      setProfileForm({ ...profileForm, location: value });

      // Clear previous timeout
      if ((window as any).locationSearchTimeout) {
        clearTimeout((window as any).locationSearchTimeout);
      }

      // Set new timeout
      (window as any).locationSearchTimeout = setTimeout(() => {
        searchLocations(value);
      }, 300);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (location: any) => {
    if (profileForm) {
      setProfileForm({ ...profileForm, location: location.displayName });
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch("/api/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat: latitude,
              lon: longitude,
            }),
          });

          if (response.ok) {
            const locationData = await response.json();
            if (profileForm) {
              setProfileForm({
                ...profileForm,
                location: locationData.displayName,
              });
            }
          } else {
            alert("Failed to get location details. Please enter manually.");
          }
        } catch (error) {
          console.error("Error getting location details:", error);
          alert("Failed to get location details. Please enter manually.");
        }
      },
      (error) => {
        console.error("Error getting current position:", error);
        alert("Unable to get your current location. Please enter manually.");
      }
    );
  };

  // Helper function to generate monthly activity data
  const generateMonthlyActivity = (stats: any): MonthlyActivityData[] => {
    if (!stats.trendsData || stats.trendsData.length === 0) return [];

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Group trends by month
    const groupedByMonth = stats.trendsData.reduce((acc: Record<string, MonthlyActivityData>, trend: any) => {
      const date = new Date(trend.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = months[date.getMonth()];

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, scans: 0 };
      }
      acc[monthKey].scans += trend.scansCount;
      return acc;
    }, {} as Record<string, MonthlyActivityData>);

    return (Object.values(groupedByMonth) as MonthlyActivityData[]).slice(-6); // Last 6 months
  };

  // Download dashboard PDF function
  const downloadDashboardPDF = async () => {
    if (!currentUser) return;

    try {
      const stats = CropDataManager.getStats(currentUser.id);
      const diseaseStats = CropDataManager.getDiseaseStats(currentUser.id);
      const recentScans = CropDataManager.getRecentAnalysisResults(
        currentUser.id,
        30
      );

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dashboard Report - ${currentUser.farmName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .header h1 { color: #10b981; margin: 0; font-size: 2.5em; }
            .header p { margin: 5px 0; color: #666; }
            .stats-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #10b981; }
            .stat-value { font-size: 2em; font-weight: bold; color: #10b981; margin-bottom: 5px; }
            .stat-label { color: #666; }
            .section { margin: 30px 0; }
            .section h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .crop-item { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
            .health-bar { width: 200px; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
            .health-fill { height: 100%; border-radius: 10px; }
            .disease-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .weather-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .weather-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
            .footer { text-align: center; margin-top: 50px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Farm Dashboard Report</h1>
            <p><strong>Farm:</strong> ${currentUser.farmName}</p>
            <p><strong>Farmer:</strong> ${currentUser.name}</p>
            <p><strong>Location:</strong> ${currentUser.location}</p>
            <p><strong>Farm Size:</strong> ${currentUser.farmSize} acres</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="stats-overview">
            <div class="stat-card">
              <div class="stat-value">${stats.totalScans}</div>
              <div class="stat-label">Total Scans</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.healthyScans}</div>
              <div class="stat-label">Healthy Scans</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.diseasedScans}</div>
              <div class="stat-label">Issues Detected</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.averageHealthScore}%</div>
              <div class="stat-label">Avg Health Score</div>
            </div>
          </div>

          <div class="section">
            <h2>🌾 Current Crop Health Status</h2>
            ${
              cropData.length > 0
                ? cropData
                    .map(
                      (crop) => `
              <div class="crop-item">
                <div>
                  <strong>${crop.cropType}</strong><br>
                  <small>${crop.area} acres • Last scanned: ${
                        crop.lastScanned
                      }</small>
                </div>
                <div>
                  <div class="health-bar">
                    <div class="health-fill" style="width: ${
                      crop.healthScore
                    }%; background: ${
                        crop.healthScore >= 80
                          ? "#10b981"
                          : crop.healthScore >= 60
                          ? "#f59e0b"
                          : "#ef4444"
                      };"></div>
                  </div>
                  <small>${crop.healthScore}% Health</small>
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No crop data available. Start scanning crops to see health status.</p>"
            }
          </div>

          <div class="section">
            <h2>🦠 Disease Analysis</h2>
            ${
              Object.keys(diseaseStats).length > 0
                ? Object.entries(diseaseStats)
                    .map(
                      ([disease, count]) => `
                <div class="disease-item">
                  <span>${disease}</span>
                  <span><strong>${count}</strong> occurrences</span>
                </div>
              `
                    )
                    .join("")
                : "<p>No diseases detected. Your crops are healthy!</p>"
            }
          </div>

          <div class="section">
            <h2>🌤️ Current Weather Conditions</h2>
            <div class="weather-grid">
              <div class="weather-item">
                <strong>Temperature</strong><br>
                ${weatherData.temperature}°C
              </div>
              <div class="weather-item">
                <strong>Humidity</strong><br>
                ${weatherData.humidity}%
              </div>
              <div class="weather-item">
                <strong>Conditions</strong><br>
                ${weatherData.description}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📊 Health Trends</h2>
            ${stats.trendsData
              .slice(-7)
              .map(
                (trend) => `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span>${new Date(trend.date).toLocaleDateString()}</span>
                <span><strong>${trend.healthScore}%</strong> (${
                  trend.scansCount
                } scans)</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="footer">
            <p><strong>Generated by CropGuard AI Dashboard</strong></p>
            <p>Comprehensive farm management and crop health monitoring</p>
            <p>Report generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report. Please try again.");
    }
  };

  // Profile Management
  const handleSaveProfile = () => {
    if (!profileForm || !currentUser) return;

    // Update currentUser
    setCurrentUser(profileForm);
    localStorage.setItem("currentUser", JSON.stringify(profileForm));

    // Update users array
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((user: Farmer) =>
      user.id === profileForm.id ? profileForm : user
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    setIsEditingProfile(false);
    addNotification({
      type: "scan_completed",
      title: "Profile Updated",
      message: "Your profile information has been successfully updated.",
    });
  };

  // Notification Management
  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">
  ) => {
    if (!currentUser) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem(
      `notifications_${currentUser.id}`,
      JSON.stringify(updatedNotifications)
    );
  };

  const markNotificationAsRead = (notificationId: string) => {
    if (!currentUser) return;

    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem(
      `notifications_${currentUser.id}`,
      JSON.stringify(updatedNotifications)
    );
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const StatCard = ({ icon: Icon, title, value, trend, color }: any) => (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statHeader}>
        <Icon className={styles.statIcon} />
        <span className={styles.statTrend}>
          {trend > 0 ? "+" : ""}
          {trend}%
        </span>
      </div>
      <div className={styles.statContent}>
        <h3 className={styles.statValue}>{value}</h3>
        <p className={styles.statTitle}>{title}</p>
      </div>
    </div>
  );

  const CropHealthChart = () => (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Crop Health Overview</h3>
        {cropData.length > 0 && (
          <button
            onClick={() => (window.location.href = "/crop-analyzer")}
            className={styles.addScanButton}
          >
            <Camera className="w-4 h-4" />
            New Scan
          </button>
        )}
      </div>
      <div className={styles.cropList}>
        {cropData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className={styles.emptyStateTitle}>No Crop Analysis Yet</h4>
            <p className={styles.emptyStateText}>
              Start scanning your crops to see health data and disease detection
              results here.
            </p>
            <button
              onClick={() => (window.location.href = "/crop-analyzer")}
              className={styles.emptyStateButton}
            >
              <Camera className="w-4 h-4" />
              Scan Your First Crop
            </button>
          </div>
        ) : (
          cropData.map((crop, index) => (
            <div key={index} className={styles.cropItem}>
              <div className={styles.cropInfo}>
                <div className={styles.cropName}>
                  {crop.cropType}
                  {(crop as any).trend && (
                    <span className={styles.trendIcon}>
                      {(crop as any).trend === "up" && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                      {(crop as any).trend === "down" && (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      {(crop as any).trend === "stable" && (
                        <Minus className="w-3 h-3 text-gray-500" />
                      )}
                    </span>
                  )}
                </div>
                <div className={styles.cropDetails}>
                  {crop.area} acres • {crop.lastScanned}
                  {(crop as any).scanCount &&
                    ` • ${(crop as any).scanCount} scans`}
                </div>
              </div>
              <div className={styles.cropHealth}>
                <div className={styles.healthScore}>{crop.healthScore}%</div>
                <div className={styles.healthBar}>
                  <div
                    className={styles.healthProgress}
                    style={{
                      width: `${crop.healthScore}%`,
                      backgroundColor:
                        crop.healthScore >= 80
                          ? "#10b981"
                          : crop.healthScore >= 60
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>
                {crop.diseaseDetected ? (
                  <AlertTriangle className={styles.alertIcon} />
                ) : (
                  <CheckCircle className={styles.successIcon} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const WeatherWidget = () => (
    <div className={styles.weatherWidget}>
      <h3 className={styles.widgetTitle}>
        Weather Conditions
        {weatherData.location && (
          <span className={styles.weatherLocation}>
            📍 {weatherData.location}
          </span>
        )}
      </h3>
      {weatherData.description && (
        <div className={styles.weatherDescription}>
          {weatherData.description}
        </div>
      )}
      <div className={styles.weatherGrid}>
        <div className={styles.weatherItem}>
          <Thermometer className={styles.weatherIcon} />
          <div className={styles.weatherValue}>{weatherData.temperature}°C</div>
          <div className={styles.weatherLabel}>Temperature</div>
        </div>
        <div className={styles.weatherItem}>
          <Droplets className={styles.weatherIcon} />
          <div className={styles.weatherValue}>{weatherData.humidity}%</div>
          <div className={styles.weatherLabel}>Humidity</div>
        </div>
        <div className={styles.weatherItem}>
          <Droplets className={styles.weatherIcon} />
          <div className={styles.weatherValue}>{weatherData.rainfall}mm</div>
          <div className={styles.weatherLabel}>Rainfall</div>
        </div>
        <div className={styles.weatherItem}>
          <Sun className={styles.weatherIcon} />
          <div className={styles.weatherValue}>{weatherData.sunlight}h</div>
          <div className={styles.weatherLabel}>Sunlight</div>
        </div>
      </div>
      {weatherData.windSpeed !== undefined && (
        <div className={styles.weatherExtra}>
          <span>🌪️ Wind: {weatherData.windSpeed} m/s</span>
          {weatherData.pressure && (
            <span>🔻 Pressure: {weatherData.pressure} hPa</span>
          )}
        </div>
      )}
    </div>
  );

  const NearbyFarmersWidget = () => (
    <div className={styles.farmersWidget}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>Nearby Farmers</h3>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search farmers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      <div className={styles.farmersList}>
        {nearbyFarmers
          .filter((farmer) =>
            farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((farmer) => (
            <div key={farmer.id} className={styles.farmerItem}>
              <div className={styles.farmerAvatar}>{farmer.name.charAt(0)}</div>
              <div className={styles.farmerInfo}>
                <div className={styles.farmerName}>
                  {farmer.name}
                  <span
                    className={`${styles.statusDot} ${styles[farmer.status]}`}
                  />
                </div>
                <div className={styles.farmerDetails}>
                  <MapPin className={styles.locationIcon} />
                  {farmer.distance} km away
                </div>
                <div className={styles.farmerCrops}>
                  {farmer.cropTypes.join(", ")}
                </div>
              </div>
              <button
                type="button"
                className={styles.messageButton}
                aria-label="Send message"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );

  const CreateDialog = () =>
    showCreateDialog && (
      <div className={styles.dialogOverlay}>
        <div className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <h2 className={styles.dialogTitle}>Quick Actions</h2>
            <button
              onClick={() => setShowCreateDialog(false)}
              className={styles.closeButton}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
          <div className={styles.actionGrid}>
            <button
              className={styles.actionButton}
              onClick={() => {
                window.location.href = "/crop-analyzer";
              }}
              aria-label="Scan Crop"
            >
              <Camera className="w-6 h-6" />
              <span>Scan Crop</span>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                window.location.href = "/schedule";
              }}
            >
              <Calendar className="w-6 h-6" />
              <span>Schedule Scan</span>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                window.location.href = "/calendar";
              }}
            >
              <Calendar className="w-6 h-6" />
              <span>View Calendar</span>
            </button>
            <button className={styles.actionButton} aria-label="Contact Expert">
              <MessageCircle className="w-6 h-6" />
              <span>Contact Expert</span>
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className={styles.logoText}>CropGuard AI</span>
          </div>

          <div className={styles.headerCenter}>
            <h1 className={styles.welcomeText}>
              Welcome back, {currentUser?.name}
            </h1>
            <p className={styles.farmInfo}>
              {currentUser?.farmName} • {currentUser?.location}
            </p>
          </div>

          <div className={styles.headerActions}>
            <nav className={styles.navigation}>
              <button
                className={styles.navButton}
                onClick={() => (window.location.href = "/schedule")}
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>
              <button
                className={styles.navButton}
                onClick={() => (window.location.href = "/calendar")}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>
            </nav>
            <button
              className={styles.headerButton}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Toggle notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              className={styles.headerButton}
              onClick={() => setShowProfileModal(true)}
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {cropData.length > 0 ? (
              <>
                <StatCard
                  icon={Leaf}
                  title="Total Scans"
                  value={
                    currentUser
                      ? CropDataManager.getStats(currentUser.id).totalScans
                      : 0
                  }
                  trend={0}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Avg Health Score"
                  value={
                    cropData.length > 0
                      ? `${Math.round(
                          cropData.reduce(
                            (acc, crop) => acc + crop.healthScore,
                            0
                          ) / cropData.length
                        )}%`
                      : "0%"
                  }
                  trend={0}
                  color="blue"
                />
                <StatCard
                  icon={AlertTriangle}
                  title="Issues Detected"
                  value={
                    currentUser
                      ? CropDataManager.getStats(currentUser.id).diseasedScans
                      : 0
                  }
                  trend={0}
                  color="orange"
                />
                <StatCard
                  icon={Camera}
                  title="Crop Types"
                  value={cropData.length}
                  trend={0}
                  color="purple"
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={Leaf}
                  title="Total Scans"
                  value={0}
                  trend={0}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Avg Health Score"
                  value="0%"
                  trend={0}
                  color="blue"
                />
                <StatCard
                  icon={AlertTriangle}
                  title="Issues Detected"
                  value={0}
                  trend={0}
                  color="orange"
                />
                <StatCard
                  icon={Camera}
                  title="Crop Types"
                  value={0}
                  trend={0}
                  color="purple"
                />
              </>
            )}
          </div>

          {/* Main Dashboard Grid */}
          <div className={styles.dashboardGrid}>
            <div className={styles.mainColumn}>
              <CropHealthChart />

              <div className={styles.activityFeed}>
                <h3 className={styles.sectionTitle}>Recent Activity</h3>
                <div className={styles.activityList}>
                  {currentUser &&
                    (() => {
                      const recentScans =
                        CropDataManager.getRecentAnalysisResults(
                          currentUser.id,
                          7
                        );
                      return recentScans.length > 0 ? (
                        recentScans.slice(0, 5).map((scan, index) => (
                          <div
                            key={scan.id || index}
                            className={styles.activityItem}
                          >
                            <div className={styles.activityIcon}>
                              {scan.diseaseDetected ? (
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className={styles.activityContent}>
                              <p>
                                {scan.cropType} scan completed -{" "}
                                {scan.diseaseDetected
                                  ? `${scan.diseaseName || "Disease"} detected`
                                  : "Healthy"}
                              </p>
                              <span className={styles.activityTime}>
                                {(() => {
                                  const scanDate = new Date(scan.analysisDate);
                                  const now = new Date();
                                  const diffHours = Math.floor(
                                    (now.getTime() - scanDate.getTime()) /
                                      (1000 * 60 * 60)
                                  );
                                  return diffHours < 1
                                    ? "Just now"
                                    : diffHours < 24
                                    ? `${diffHours} hours ago`
                                    : `${Math.floor(diffHours / 24)} days ago`;
                                })()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyActivity}>
                          <Activity className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-gray-500">No recent activity</p>
                          <p className="text-sm text-gray-400">
                            Start scanning crops to see your activity here
                          </p>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>

            <div className={styles.sidebar}>
              <WeatherWidget />
              <NearbyFarmersWidget />
            </div>
          </div>

          {/* Dashboard Graphs Section */}
          <div className={styles.graphsSection}>
            <div className={styles.graphsHeader}>
              <h2 className={styles.graphsTitle}>
                📊 Farm Analytics & Insights
              </h2>
              <button
                onClick={downloadDashboardPDF}
                className={styles.downloadDashboardBtn}
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            <div className={styles.graphsGrid}>
              {/* Health Trends Graph */}
              <div className={styles.graphCard}>
                <h3 className={styles.graphCardTitle}>
                  Health Trends (Last 30 Days)
                </h3>
                {currentUser &&
                  (() => {
                    const stats = CropDataManager.getStats(currentUser.id);
                    const trendsData = stats.trendsData.slice(-14); // Last 14 days

                    return trendsData.length > 0 ? (
                      <div className={styles.healthTrendsGraph}>
                        <div className={styles.trendsContainer}>
                          {trendsData.map((trend, index) => (
                            <div key={trend.date} className={styles.trendBar}>
                              <div
                                className={styles.trendBarFill}
                                style={{
                                  height: `${
                                    (trend.healthScore / 100) * 120
                                  }px`,
                                  backgroundColor:
                                    trend.healthScore >= 80
                                      ? "#10b981"
                                      : trend.healthScore >= 60
                                      ? "#f59e0b"
                                      : "#ef4444",
                                }}
                              />
                              <span className={styles.trendDate}>
                                {new Date(trend.date).toLocaleDateString("en", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className={styles.trendValue}>
                                {trend.healthScore}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyGraph}>
                        <Activity className="w-12 h-12 text-gray-400 mb-2" />
                        <p>No trend data available</p>
                        <p className="text-sm text-gray-400">
                          Start scanning crops to see trends
                        </p>
                      </div>
                    );
                  })()}
              </div>

              {/* Disease Distribution */}
              <div className={styles.graphCard}>
                <h3 className={styles.graphCardTitle}>Disease Distribution</h3>
                {currentUser &&
                  (() => {
                    const diseaseStats = CropDataManager.getDiseaseStats(
                      currentUser.id
                    );
                    const hasData = Object.keys(diseaseStats).length > 0;

                    return hasData ? (
                      <div className={styles.diseaseChart}>
                        {Object.entries(diseaseStats)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([disease, count]) => (
                            <div key={disease} className={styles.diseaseItem}>
                              <div className={styles.diseaseInfo}>
                                <span className={styles.diseaseName}>
                                  {disease}
                                </span>
                                <span className={styles.diseaseCount}>
                                  {count} cases
                                </span>
                              </div>
                              <div className={styles.diseaseBar}>
                                <div
                                  className={styles.diseaseBarFill}
                                  style={{
                                    width: `${
                                      (count /
                                        Math.max(
                                          ...Object.values(diseaseStats)
                                        )) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className={styles.emptyGraph}>
                        <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                        <p>No diseases detected!</p>
                        <p className="text-sm text-gray-400">
                          Your crops are healthy
                        </p>
                      </div>
                    );
                  })()}
              </div>

              {/* Monthly Activity Summary */}
              <div className={styles.graphCard}>
                <h3 className={styles.graphCardTitle}>Monthly Scan Activity</h3>
                {currentUser &&
                  (() => {
                    const stats = CropDataManager.getStats(currentUser.id);
                    const monthlyData = generateMonthlyActivity(stats);

                    return monthlyData.length > 0 ? (
                      <div className={styles.monthlyChart}>
                        {monthlyData.map((month, index) => (
                          <div key={month.month} className={styles.monthBar}>
                            <div
                              className={styles.monthBarFill}
                              style={{
                                height: `${
                                  (month.scans /
                                    Math.max(
                                      ...monthlyData.map((m) => m.scans)
                                    )) *
                                  100
                                }px`,
                              }}
                            />
                            <span className={styles.monthLabel}>
                              {month.month}
                            </span>
                            <span className={styles.monthValue}>
                              {month.scans}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyGraph}>
                        <Calendar className="w-12 h-12 text-blue-500 mb-2" />
                        <p>No scan history</p>
                        <p className="text-sm text-gray-400">
                          Activity will appear here
                        </p>
                      </div>
                    );
                  })()}
              </div>

              {/* Crop Health Distribution */}
              <div className={styles.graphCard}>
                <h3 className={styles.graphCardTitle}>
                  Crop Health Distribution
                </h3>
                {cropData.length > 0 ? (
                  <div className={styles.healthDistribution}>
                    <div className={styles.healthPieChart}>
                      {(() => {
                        const healthy = cropData.filter(
                          (c) => c.healthScore >= 80
                        ).length;
                        const moderate = cropData.filter(
                          (c) => c.healthScore >= 60 && c.healthScore < 80
                        ).length;
                        const poor = cropData.filter(
                          (c) => c.healthScore < 60
                        ).length;
                        const total = cropData.length;

                        return (
                          <>
                            <div className={styles.pieChartVisual}>
                              <div
                                className={styles.pieSegment}
                                style={{
                                  background: `conic-gradient(
                                    #10b981 0deg ${(healthy / total) * 360}deg,
                                    #f59e0b ${(healthy / total) * 360}deg ${
                                    ((healthy + moderate) / total) * 360
                                  }deg,
                                    #ef4444 ${
                                      ((healthy + moderate) / total) * 360
                                    }deg 360deg
                                  )`,
                                }}
                              />
                            </div>
                            <div className={styles.pieLegend}>
                              <div className={styles.legendItem}>
                                <div
                                  className={styles.legendColor}
                                  style={{ background: "#10b981" }}
                                />
                                <span>Healthy ({healthy})</span>
                              </div>
                              <div className={styles.legendItem}>
                                <div
                                  className={styles.legendColor}
                                  style={{ background: "#f59e0b" }}
                                />
                                <span>Moderate ({moderate})</span>
                              </div>
                              <div className={styles.legendItem}>
                                <div
                                  className={styles.legendColor}
                                  style={{ background: "#ef4444" }}
                                />
                                <span>Poor ({poor})</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyGraph}>
                    <PieChart className="w-12 h-12 text-purple-500 mb-2" />
                    <p>No health data</p>
                    <p className="text-sm text-gray-400">
                      Scan crops to see distribution
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className={styles.fab}
        aria-label="Open quick actions"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <CreateDialog />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent} style={{ maxWidth: "32rem" }}>
            <div className={styles.dialogHeader}>
              <h2 className={styles.dialogTitle}>Profile Settings</h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditingProfile(false);
                  setProfileForm(currentUser);
                }}
                className={styles.closeButton}
                aria-label="Close profile modal"
              >
                ✕
              </button>
            </div>
            <div className={styles.profileForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullNameInput" className={styles.formLabel}>
                    Full Name
                  </label>
                  <input
                    id="fullNameInput"
                    type="text"
                    value={profileForm?.name || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        name: e.target.value,
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="emailInput" className={styles.formLabel}>
                    Email
                  </label>
                  <input
                    id="emailInput"
                    type="email"
                    value={profileForm?.email || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        email: e.target.value,
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Farm Name</label>
                  <label htmlFor="farmNameInput" className={styles.formLabel}>
                    Farm Name
                  </label>
                  <input
                    id="farmNameInput"
                    type="text"
                    value={profileForm?.farmName || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        farmName: e.target.value,
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="locationInput" className={styles.formLabel}>
                    Location
                  </label>
                  <div style={{ position: "relative" }} data-location-container>
                    <input
                      id="locationInput"
                      type="text"
                      placeholder={
                        isEditingProfile ? "Start typing city name..." : ""
                      }
                      value={profileForm?.location || ""}
                      onChange={(e) => {
                        if (isEditingProfile) {
                          handleLocationChange(e.target.value);
                        }
                      }}
                      onFocus={() => {
                        if (
                          isEditingProfile &&
                          locationSuggestions.length > 0
                        ) {
                          setShowLocationSuggestions(true);
                        }
                      }}
                      disabled={!isEditingProfile}
                      className={styles.formInput}
                      autoComplete="off"
                    />
                    {isEditingProfile && (
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        title="Use my current location"
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          color: "#666",
                        }}
                      >
                        <LocationIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Location suggestions dropdown */}
                    {isEditingProfile &&
                      showLocationSuggestions &&
                      locationSuggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "0",
                            right: "0",
                            background: "white",
                            border: "1px solid #ddd",
                            borderTop: "none",
                            borderRadius: "0 0 4px 4px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          {locationSuggestions.map((location, index) => (
                            <div
                              key={index}
                              onClick={() => handleLocationSelect(location)}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderBottom:
                                  index < locationSuggestions.length - 1
                                    ? "1px solid #eee"
                                    : "none",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#f5f5f5";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                              }}
                            >
                              <div
                                style={{ fontWeight: "bold", fontSize: "14px" }}
                              >
                                {location.name}
                              </div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {location.state && `${location.state}, `}
                                {location.country}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Loading indicator */}
                    {isEditingProfile && isLoadingLocations && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "0",
                          right: "0",
                          background: "white",
                          border: "1px solid #ddd",
                          borderTop: "none",
                          borderRadius: "0 0 4px 4px",
                          padding: "8px 12px",
                          zIndex: 1000,
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        Searching locations...
                      </div>
                    )}
                  </div>
                  {isEditingProfile && (
                    <small
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      Type your city name or click the location icon to use GPS
                    </small>
                  )}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Farm Size (acres)</label>
                  <label htmlFor="farmSizeInput" className={styles.formLabel}>
                    Farm Size (acres)
                  </label>
                  <input
                    id="farmSizeInput"
                    type="number"
                    min="0"
                    step="0.01"
                    value={profileForm?.farmSize ?? 0}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        farmSize:
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="experienceInput" className={styles.formLabel}>
                    Years of Experience
                  </label>
                  <input
                    id="experienceInput"
                    type="number"
                    min="0"
                    value={profileForm?.experienceYears ?? 0}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        experienceYears:
                          e.target.value === ""
                            ? 0
                            : parseInt(e.target.value, 10),
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <label htmlFor="phoneInput" className={styles.formLabel}>
                  Phone
                </label>
                <input
                  id="phoneInput"
                  type="tel"
                  value={profileForm?.phone || ""}
                  onChange={(e) =>
                    profileForm &&
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  disabled={!isEditingProfile}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cropSelect" className={styles.formLabel}>
                  Crop Types
                </label>
                <div className={styles.cropTypesContainer}>
                  {/* Display selected crops */}
                  {profileForm?.cropTypes?.map((crop, index) => (
                    <span key={index} className={styles.cropTag}>
                      {crop}
                      {isEditingProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedCrops = profileForm.cropTypes.filter(
                              (_, i) => i !== index
                            );
                            setProfileForm({
                              ...profileForm,
                              cropTypes: updatedCrops,
                            });
                          }}
                          className={styles.cropTagRemove}
                          aria-label={`Remove ${crop}`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Multi-select dropdown */}
                  {isEditingProfile && (
                    <select
                      id="cropSelect"
                      multiple
                      size={5} // optional: show 5 options at once
                      value={profileForm?.cropTypes || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        setProfileForm({
                          ...profileForm!,
                          cropTypes: selectedOptions,
                        });
                      }}
                      className={styles.cropSelect}
                      aria-label="Select multiple crops"
                    >
                      <option value="Corn">Corn</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Soybeans">Soybeans</option>
                      <option value="Rice">Rice</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Potatoes">Potatoes</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Sunflower">Sunflower</option>
                    </select>
                  )}
                </div>
              </div>
              <div className={styles.profileActions}>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className={`${styles.profileButton} ${styles.profileButtonPrimary}`}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileForm(currentUser);
                      }}
                      className={`${styles.profileButton} ${styles.profileButtonSecondary}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className={`${styles.profileButton} ${styles.profileButtonPrimary}`}
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.notificationsHeader}>
            <h3 className={styles.notificationsTitle}>Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className={styles.notificationsCloseButton}
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.notificationsEmpty}>
                <Bell className={styles.notificationsEmptyIcon} />
                <p>No notifications</p>
              </div>
            ) : (
              <div className={styles.notificationsItems}>
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${
                      !notification.isRead ? styles.notificationItemUnread : ""
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className={styles.notificationContent}>
                      <div
                        className={`${styles.notificationDot} ${
                          notification.type === "scan_completed"
                            ? styles.notificationDotCompleted
                            : notification.type === "scan_scheduled"
                            ? styles.notificationDotScheduled
                            : notification.type === "disease_detected"
                            ? styles.notificationDotDetected
                            : notification.type === "weather_alert"
                            ? styles.notificationDotAlert
                            : styles.notificationDotDefault
                        }`}
                      />
                      <div className={styles.notificationText}>
                        <p className={styles.notificationTitle}>
                          {notification.title}
                        </p>
                        <p className={styles.notificationMessage}>
                          {notification.message}
                        </p>
                        <p className={styles.notificationTime}>
                          {new Date(
                            notification.timestamp
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(notification.timestamp).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className={styles.notificationsFooter}>
              <button
                className={styles.notificationsViewAll}
                aria-label="View all notifications"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
