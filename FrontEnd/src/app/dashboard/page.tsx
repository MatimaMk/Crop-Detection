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
} from "lucide-react";
import styles from "./dashboard.module.css";

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

interface ScheduledScan {
  id: string;
  cropType: string;
  scheduledDate: string;
  scheduledTime: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  status: "pending" | "completed" | "cancelled";
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

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Farmer | null>(null);

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
  }, []);

  const loadWeatherData = async (location: string, userId: string) => {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);

      if (response.ok) {
        const weatherData = await response.json();
        setWeatherData(weatherData);
        // Cache for 1 hour
        const cacheData = {
          data: weatherData,
          timestamp: Date.now(),
          expires: Date.now() + (60 * 60 * 1000) // 1 hour
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
          location: location
        });
      }
    } catch (error) {
      console.warn('Failed to load weather data:', error);

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
        location: location
      });
    }
  };

  const loadUserData = (userId: string) => {
    // Load crop data
    const savedCropData = localStorage.getItem(`cropData_${userId}`);
    if (savedCropData) {
      setCropData(JSON.parse(savedCropData));
    } else {
      // Initialize with user's actual crops from their profile
      const currentUserData = localStorage.getItem("currentUser");
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        const userCrops = user.cropTypes || [];

        // Create initial crop data based on user's crops
        const defaultCropData = userCrops.slice(0, 3).map((crop: string, index: number) => ({
          cropType: crop,
          healthScore: 85 + Math.floor(Math.random() * 15), // 85-100
          lastScanned: index === 0 ? "2 hours ago" : `${index + 1} days ago`,
          diseaseDetected: Math.random() < 0.2, // 20% chance of disease
          area: Math.round((user.farmSize / userCrops.length) * 10) / 10, // Distribute farm area
        }));

        // If user has no crops defined, use defaults
        if (defaultCropData.length === 0) {
          defaultCropData.push({
            cropType: "Mixed Crops",
            healthScore: 88,
            lastScanned: "1 day ago",
            diseaseDetected: false,
            area: user.farmSize || 10,
          });
        }

        setCropData(defaultCropData);
        localStorage.setItem(
          `cropData_${userId}`,
          JSON.stringify(defaultCropData)
        );
      }
    }

    // Load scheduled scans
    const savedScans = localStorage.getItem(`scheduledScans_${userId}`);
    if (savedScans) {
      setScheduledScans(JSON.parse(savedScans));
    }

    // Load notifications
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    // Load nearby farmers
    const savedFarmers = localStorage.getItem("nearbyFarmers");
    if (savedFarmers) {
      setNearbyFarmers(JSON.parse(savedFarmers));
    } else {
      // Initialize with sample nearby farmers
      const defaultFarmers = [
        {
          id: "1",
          name: "Sarah Johnson",
          distance: 2.1,
          cropTypes: ["Corn", "Wheat"],
          status: "online" as const,
        },
        {
          id: "2",
          name: "Mike Thompson",
          distance: 3.5,
          cropTypes: ["Soybeans", "Corn"],
          status: "online" as const,
        },
      ];
      setNearbyFarmers(defaultFarmers);
      localStorage.setItem("nearbyFarmers", JSON.stringify(defaultFarmers));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
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
      <h3 className={styles.chartTitle}>Crop Health Overview</h3>
      <div className={styles.cropList}>
        {cropData.map((crop, index) => (
          <div key={index} className={styles.cropItem}>
            <div className={styles.cropInfo}>
              <div className={styles.cropName}>{crop.cropType}</div>
              <div className={styles.cropDetails}>
                {crop.area} acres • {crop.lastScanned}
              </div>
            </div>
            <div className={styles.cropHealth}>
              <div className={styles.healthScore}>{crop.healthScore}%</div>
              <div className={styles.healthBar}>
                <div
                  className={styles.healthProgress}
                  style={{ width: `${crop.healthScore}%` }}
                />
              </div>
              {crop.diseaseDetected ? (
                <AlertTriangle className={styles.alertIcon} />
              ) : (
                <CheckCircle className={styles.successIcon} />
              )}
            </div>
          </div>
        ))}
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
            <StatCard
              icon={Leaf}
              title="Total Crops"
              value={cropData.length}
              trend={12}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              title="Avg Health Score"
              value={`${Math.round(
                cropData.reduce((acc, crop) => acc + crop.healthScore, 0) /
                  cropData.length
              )}%`}
              trend={5}
              color="blue"
            />
            <StatCard
              icon={AlertTriangle}
              title="Issues Detected"
              value={cropData.filter((crop) => crop.diseaseDetected).length}
              trend={-8}
              color="orange"
            />
            <StatCard
              icon={Users}
              title="Nearby Farmers"
              value={nearbyFarmers.length}
              trend={3}
              color="purple"
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className={styles.dashboardGrid}>
            <div className={styles.mainColumn}>
              <CropHealthChart />

              <div className={styles.activityFeed}>
                <h3 className={styles.sectionTitle}>Recent Activity</h3>
                <div className={styles.activityList}>
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className={styles.activityContent}>
                      <p>Corn crop scan completed - Healthy</p>
                      <span className={styles.activityTime}>2 hours ago</span>
                    </div>
                  </div>
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className={styles.activityContent}>
                      <p>Wheat crop shows signs of rust disease</p>
                      <span className={styles.activityTime}>1 day ago</span>
                    </div>
                  </div>
                  <div className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className={styles.activityContent}>
                      <p>Message from Sarah Johnson</p>
                      <span className={styles.activityTime}>2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebar}>
              <WeatherWidget />
              <NearbyFarmersWidget />
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
                  <input
                    id="locationInput"
                    type="text"
                    value={profileForm?.location || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm!,
                        location: e.target.value,
                      })
                    }
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
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
