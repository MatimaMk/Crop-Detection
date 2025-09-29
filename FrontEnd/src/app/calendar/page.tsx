"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Droplet,
  Sprout,
  Scissors,
  Truck,
  Zap,
  Bug,
  Activity,
  Camera,
} from "lucide-react";
import styles from "./calendar.module.css";

interface Farmer {
  id: string;
  name: string;
  email: string;
  farmName: string;
  location: string;
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
  cropType?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  status: "pending" | "completed" | "cancelled" | "overdue";
  priority: "low" | "medium" | "high";
  weather_dependent?: boolean;
  equipment_needed?: string[];
  createdAt: string;
}

interface Notification {
  id: string;
  type:
    | "activity_scheduled"
    | "activity_reminder"
    | "activity_completed"
    | "disease_detected"
    | "weather_alert"
    | "maintenance_due";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedActivityId?: string;
}

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayView, setShowDayView] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadUserData(user.id);
    } else {
      // Redirect to login if no user data
      window.location.href = "/";
    }
  }, []);

  const loadUserData = (userId: string) => {
    // Load farm activities (migrate from old scheduledScans if needed)
    let activities: FarmActivity[] = [];

    // First try to load new format
    const savedActivities = localStorage.getItem(`farmActivities_${userId}`);
    if (savedActivities) {
      activities = JSON.parse(savedActivities);
    } else {
      // Migrate from old format
      const savedScans = localStorage.getItem(`scheduledScans_${userId}`);
      if (savedScans) {
        const oldScans = JSON.parse(savedScans);
        activities = oldScans.map((scan: any) => ({
          ...scan,
          activityType: "scan" as const,
          priority: "medium" as const,
          weather_dependent: false,
        }));
        // Save in new format
        localStorage.setItem(
          `farmActivities_${userId}`,
          JSON.stringify(activities)
        );
      }
    }
    setFarmActivities(activities);

    // Load notifications
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  };

  // Helper function to get activity type icon and info
  const getActivityInfo = (activityType: FarmActivity["activityType"]) => {
    switch (activityType) {
      case "scan":
        return {
          icon: Camera,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          label: "Crop Scan",
        };
      case "watering":
        return {
          icon: Droplet,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          label: "Watering",
        };
      case "fertilizing":
        return {
          icon: Sprout,
          color: "text-green-600",
          bgColor: "bg-green-50",
          label: "Fertilizing",
        };
      case "harvesting":
        return {
          icon: Scissors,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          label: "Harvesting",
        };
      case "planting":
        return {
          icon: Sprout,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          label: "Planting",
        };
      case "pest_control":
        return {
          icon: Bug,
          color: "text-red-600",
          bgColor: "bg-red-50",
          label: "Pest Control",
        };
      case "pruning":
        return {
          icon: Scissors,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          label: "Pruning",
        };
      case "maintenance":
        return {
          icon: Zap,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          label: "Maintenance",
        };
      default:
        return {
          icon: Activity,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          label: "Activity",
        };
    }
  };

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

  const completeActivity = (activityId: string) => {
    if (!currentUser) return;

    const updatedActivities = farmActivities.map((activity) =>
      activity.id === activityId
        ? { ...activity, status: "completed" as const }
        : activity
    );
    setFarmActivities(updatedActivities);
    localStorage.setItem(
      `farmActivities_${currentUser.id}`,
      JSON.stringify(updatedActivities)
    );

    const completedActivity = farmActivities.find(
      (activity) => activity.id === activityId
    );
    if (completedActivity) {
      const activityInfo = getActivityInfo(completedActivity.activityType);
      addNotification({
        type: "activity_completed",
        title: "Activity Completed",
        message: `${activityInfo.label} ${
          completedActivity.cropType ? `for ${completedActivity.cropType}` : ""
        } has been completed successfully.`,
        relatedActivityId: activityId,
      });
    }
  };

  const cancelActivity = (activityId: string) => {
    if (!currentUser) return;

    const updatedActivities = farmActivities.map((activity) =>
      activity.id === activityId
        ? { ...activity, status: "cancelled" as const }
        : activity
    );
    setFarmActivities(updatedActivities);
    localStorage.setItem(
      `farmActivities_${currentUser.id}`,
      JSON.stringify(updatedActivities)
    );

    const cancelledActivity = farmActivities.find(
      (activity) => activity.id === activityId
    );
    if (cancelledActivity) {
      const activityInfo = getActivityInfo(cancelledActivity.activityType);
      addNotification({
        type: "activity_reminder",
        title: "Activity Cancelled",
        message: `${activityInfo.label} ${
          cancelledActivity.cropType ? `for ${cancelledActivity.cropType}` : ""
        } scheduled for ${cancelledActivity.scheduledDate} has been cancelled.`,
      });
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDayIterator = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDayIterator));
      currentDayIterator.setDate(currentDayIterator.getDate() + 1);
    }

    return days;
  };

  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return farmActivities.filter(
      (activity) => activity.scheduledDate === dateStr
    );
  };

  const selectedDateActivities = selectedDate
    ? getActivitiesForDate(new Date(selectedDate))
    : [];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = getDaysInMonth();
  const today = new Date();

  return (
    <div className={styles.calendarPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              onClick={() => (window.location.href = "/dashboard")}
              className={styles.backButton}
              title="Go back to dashboard"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className={styles.headerText}>
                <h1 className={styles.pageTitle}>Activity Calendar</h1>
                <p className={styles.pageSubtitle}>
                  View and manage scheduled farm activities
                </p>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => (window.location.href = "/schedule")}
              className={styles.addButton}
              title="Schedule new activity"
              aria-label="Schedule new activity"
            >
              <Plus className="w-5 h-5" />
              <span>Schedule Activity</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.calendarLayout}>
            {/* Calendar View */}
            <div className={styles.calendarSection}>
              <div className={styles.calendarHeader}>
                <div className={styles.monthNavigation}>
                  <button
                    type="button"
                    onClick={() => navigateMonth("prev")}
                    className={styles.navButton}
                    title="Previous month"
                    aria-label="Go to previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className={styles.monthTitle}>
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateMonth("next")}
                    className={styles.navButton}
                    title="Next month"
                    aria-label="Go to next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendDot} ${styles.pending}`}
                    ></div>
                    <span>Pending</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendDot} ${styles.completed}`}
                    ></div>
                    <span>Completed</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendDot} ${styles.cancelled}`}
                    ></div>
                    <span>Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className={styles.calendar}>
                {/* Day Headers */}
                <div className={styles.dayHeaders}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className={styles.dayHeader}>
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Days */}
                <div className={styles.calendarGrid}>
                  {days.map((day, index) => {
                    const dayActivities = getActivitiesForDate(day);
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === today.toDateString();
                    const dateStr = day.toISOString().split("T")[0];
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={index}
                        className={`${styles.calendarDay} ${
                          !isCurrentMonth ? styles.otherMonth : ""
                        } ${isToday ? styles.today : ""} ${
                          isSelected ? styles.selected : ""
                        }`}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowDayView(true);
                        }}
                      >
                        <div className={styles.dayNumber}>{day.getDate()}</div>
                        <div className={styles.dayScans}>
                          {dayActivities.slice(0, 3).map((activity) => {
                            const activityInfo = getActivityInfo(
                              activity.activityType
                            );
                            const displayText =
                              activity.cropType || activityInfo.label;
                            return (
                              <div
                                key={activity.id}
                                className={`${styles.scanIndicator} ${
                                  styles[activity.status]
                                }`}
                                title={`${activityInfo.label} ${
                                  activity.cropType
                                    ? `- ${activity.cropType}`
                                    : ""
                                } - ${activity.scheduledTime}`}
                              >
                                {displayText.slice(0, 8)}
                              </div>
                            );
                          })}
                          {dayActivities.length > 3 && (
                            <div className={styles.moreScans}>
                              +{dayActivities.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className={styles.sidePanel}>
              {!showDayView ? (
                <>
                  {/* Upcoming Activities */}
                  <div className={styles.upcomingSection}>
                    <h3 className={styles.sectionTitle}>Upcoming Activities</h3>
                    <div className={styles.upcomingList}>
                      {farmActivities
                        .filter((activity) => activity.status === "pending")
                        .sort(
                          (a, b) =>
                            new Date(
                              a.scheduledDate + "T" + a.scheduledTime
                            ).getTime() -
                            new Date(
                              b.scheduledDate + "T" + b.scheduledTime
                            ).getTime()
                        )
                        .slice(0, 5)
                        .map((activity) => {
                          const activityInfo = getActivityInfo(
                            activity.activityType
                          );
                          const IconComponent = activityInfo.icon;
                          return (
                            <div
                              key={activity.id}
                              className={styles.upcomingItem}
                            >
                              <div className={styles.upcomingIcon}>
                                <IconComponent
                                  className={`w-4 h-4 ${activityInfo.color}`}
                                />
                              </div>
                              <div className={styles.upcomingContent}>
                                <h4 className={styles.upcomingTitle}>
                                  {activityInfo.label}{" "}
                                  {activity.cropType &&
                                    `- ${activity.cropType}`}
                                </h4>
                                <p className={styles.upcomingDate}>
                                  {new Date(
                                    activity.scheduledDate
                                  ).toLocaleDateString()}
                                </p>
                                <p className={styles.upcomingTime}>
                                  {activity.scheduledTime}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      {farmActivities.filter(
                        (activity) => activity.status === "pending"
                      ).length === 0 && (
                        <p className={styles.emptyText}>
                          No upcoming activities
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className={styles.statsSection}>
                    <h3 className={styles.sectionTitle}>This Month</h3>
                    <div className={styles.statsList}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>
                          {
                            farmActivities.filter((activity) => {
                              const activityDate = new Date(
                                activity.scheduledDate
                              );
                              return (
                                activityDate.getMonth() ===
                                  currentDate.getMonth() &&
                                activityDate.getFullYear() ===
                                  currentDate.getFullYear() &&
                                activity.status === "pending"
                              );
                            }).length
                          }
                        </span>
                        <span className={styles.statLabel}>Scheduled</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>
                          {
                            farmActivities.filter((activity) => {
                              const activityDate = new Date(
                                activity.scheduledDate
                              );
                              return (
                                activityDate.getMonth() ===
                                  currentDate.getMonth() &&
                                activityDate.getFullYear() ===
                                  currentDate.getFullYear() &&
                                activity.status === "completed"
                              );
                            }).length
                          }
                        </span>
                        <span className={styles.statLabel}>Completed</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Day View */
                <div className={styles.dayView}>
                  <div className={styles.dayViewHeader}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDayView(false);
                        setSelectedDate(null);
                      }}
                      className={styles.backToDayButton}
                      title="Back to calendar view"
                      aria-label="Back to calendar view"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className={styles.dayViewTitle}>
                      {selectedDate &&
                        new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </h3>
                  </div>

                  <div className={styles.dayScansContainer}>
                    {selectedDateActivities.length === 0 ? (
                      <div className={styles.noDayScans}>
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p>No activities scheduled for this day</p>
                        <button
                          type="button"
                          onClick={() => (window.location.href = "/schedule")}
                          className={styles.scheduleButton}
                          title="Schedule an activity for this day"
                          aria-label="Schedule an activity for this day"
                        >
                          Schedule an Activity
                        </button>
                      </div>
                    ) : (
                      <div className={styles.dayScansGrid}>
                        {selectedDateActivities.map((activity) => {
                          const activityInfo = getActivityInfo(
                            activity.activityType
                          );
                          const IconComponent = activityInfo.icon;
                          return (
                            <div
                              key={activity.id}
                              className={styles.dayScanCard}
                            >
                              <div className={styles.dayScanHeader}>
                                <div className={styles.dayScanStatus}>
                                  <div
                                    className={`${styles.statusIndicator} ${
                                      styles[activity.status]
                                    }`}
                                  />
                                  <IconComponent
                                    className={`w-4 h-4 ${activityInfo.color} mr-2`}
                                  />
                                  <span className={styles.cropName}>
                                    {activityInfo.label}{" "}
                                    {activity.cropType &&
                                      `- ${activity.cropType}`}
                                  </span>
                                </div>
                                <div className={styles.dayScanActions}>
                                  {activity.status === "pending" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          completeActivity(activity.id)
                                        }
                                        className={styles.actionBtn}
                                        title="Mark as completed"
                                        aria-label={`Mark ${activityInfo.label} as completed`}
                                      >
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          cancelActivity(activity.id)
                                        }
                                        className={styles.actionBtn}
                                        title="Cancel activity"
                                        aria-label={`Cancel ${activityInfo.label} activity`}
                                      >
                                        <X className="w-4 h-4 text-red-600" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className={styles.dayScanDetails}>
                                <div className={styles.dayScanDetail}>
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span>
                                    {activity.scheduledTime} (
                                    {activity.duration || 60} min)
                                  </span>
                                </div>
                                <div className={styles.dayScanDetail}>
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span>{activity.location.address}</span>
                                </div>
                              </div>
                              {activity.notes && (
                                <div className={styles.dayScanNotes}>
                                  <p>{activity.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
