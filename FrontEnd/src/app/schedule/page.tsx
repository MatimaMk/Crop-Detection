"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Droplet,
  Sprout,
  Scissors,
  Truck,
  Zap,
  Bug,
  Activity,
  AlertTriangle,
  Camera,
} from "lucide-react";
import styles from "./schedule.module.css";

interface Farmer {
  id: string;
  name: string;
  email: string;
  farmName: string;
  location: string;
}

interface FarmActivity {
  id: string;
  activityType: 'scan' | 'watering' | 'fertilizing' | 'harvesting' | 'planting' | 'pest_control' | 'pruning' | 'maintenance';
  cropType?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number; // in minutes
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

export default function SchedulePage() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    activityType: "" as FarmActivity['activityType'] | "",
    cropType: "",
    date: "",
    time: "",
    duration: 60,
    location: "",
    lat: 0,
    lng: 0,
    notes: "",
    priority: "medium" as FarmActivity['priority'],
    weather_dependent: false,
    equipment_needed: [] as string[],
    isMultiDay: false,
    numberOfDays: 1,
    repeatInterval: 1, // days between each occurrence
  });

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
          activityType: 'scan' as const,
          priority: 'medium' as const,
          weather_dependent: false,
        }));
        // Save in new format
        localStorage.setItem(`farmActivities_${userId}`, JSON.stringify(activities));
        // Remove old format
        localStorage.removeItem(`scheduledScans_${userId}`);
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
  const getActivityInfo = (activityType: FarmActivity['activityType']) => {
    switch (activityType) {
      case 'scan':
        return { icon: Camera, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Crop Scan' };
      case 'watering':
        return { icon: Droplet, color: 'text-blue-500', bgColor: 'bg-blue-50', label: 'Watering' };
      case 'fertilizing':
        return { icon: Sprout, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Fertilizing' };
      case 'harvesting':
        return { icon: Scissors, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Harvesting' };
      case 'planting':
        return { icon: Sprout, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Planting' };
      case 'pest_control':
        return { icon: Bug, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Pest Control' };
      case 'pruning':
        return { icon: Scissors, color: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Pruning' };
      case 'maintenance':
        return { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Maintenance' };
      default:
        return { icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Activity' };
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

  const handleScheduleActivity = () => {
    if (
      !currentUser ||
      !scheduleForm.activityType ||
      !scheduleForm.date ||
      !scheduleForm.time
    ) {
      return;
    }

    let updatedActivities;
    const activityInfo = getActivityInfo(scheduleForm.activityType);

    if (editingActivity) {
      // Update existing activity (single activity only)
      const activityData: Omit<FarmActivity, 'id'> = {
        activityType: scheduleForm.activityType,
        cropType: scheduleForm.cropType,
        scheduledDate: scheduleForm.date,
        scheduledTime: scheduleForm.time,
        duration: scheduleForm.duration,
        location: {
          lat: scheduleForm.lat || -25.7479 + Math.random() * 0.1,
          lng: scheduleForm.lng || 28.2293 + Math.random() * 0.1,
          address: scheduleForm.location || "Farm Location",
        },
        notes: scheduleForm.notes,
        status: "pending" as const,
        priority: scheduleForm.priority,
        weather_dependent: scheduleForm.weather_dependent,
        equipment_needed: scheduleForm.equipment_needed,
        createdAt: new Date().toISOString(),
      };

      updatedActivities = farmActivities.map((activity) =>
        activity.id === editingActivity.id ? { ...activity, ...activityData } : activity
      );
      addNotification({
        type: "activity_scheduled",
        title: "Activity Updated",
        message: `${activityInfo.label} ${scheduleForm.cropType ? `for ${scheduleForm.cropType}` : ''} updated for ${new Date(
          scheduleForm.date
        ).toLocaleDateString()} at ${scheduleForm.time}`,
        relatedActivityId: editingActivity.id,
      });
    } else {
      // Create new activities (single or multiple days)
      const newActivities: FarmActivity[] = [];
      const startDate = new Date(scheduleForm.date);
      const totalDays = scheduleForm.isMultiDay ? scheduleForm.numberOfDays : 1;

      for (let i = 0; i < totalDays; i++) {
        const activityDate = new Date(startDate);
        activityDate.setDate(startDate.getDate() + (i * scheduleForm.repeatInterval));

        const activityData: FarmActivity = {
          id: `${Date.now()}-${i}`,
          activityType: scheduleForm.activityType,
          cropType: scheduleForm.cropType,
          scheduledDate: activityDate.toISOString().split('T')[0],
          scheduledTime: scheduleForm.time,
          duration: scheduleForm.duration,
          location: {
            lat: scheduleForm.lat || -25.7479 + Math.random() * 0.1,
            lng: scheduleForm.lng || 28.2293 + Math.random() * 0.1,
            address: scheduleForm.location || "Farm Location",
          },
          notes: scheduleForm.notes,
          status: "pending" as const,
          priority: scheduleForm.priority,
          weather_dependent: scheduleForm.weather_dependent,
          equipment_needed: scheduleForm.equipment_needed,
          createdAt: new Date().toISOString(),
        };
        newActivities.push(activityData);
      }

      updatedActivities = [...farmActivities, ...newActivities];

      const scheduleMessage = scheduleForm.isMultiDay
        ? `${activityInfo.label} ${scheduleForm.cropType ? `for ${scheduleForm.cropType}` : ''} scheduled for ${totalDays} days starting ${new Date(scheduleForm.date).toLocaleDateString()}`
        : `${activityInfo.label} ${scheduleForm.cropType ? `for ${scheduleForm.cropType}` : ''} scheduled for ${new Date(scheduleForm.date).toLocaleDateString()} at ${scheduleForm.time}`;

      addNotification({
        type: "activity_scheduled",
        title: "Activity Scheduled Successfully",
        message: scheduleMessage,
        relatedActivityId: newActivities[0].id,
      });
    }

    setFarmActivities(updatedActivities);
    localStorage.setItem(
      `farmActivities_${currentUser.id}`,
      JSON.stringify(updatedActivities)
    );

    // Reset form
    setScheduleForm({
      activityType: "",
      cropType: "",
      date: "",
      time: "",
      duration: 60,
      location: "",
      lat: 0,
      lng: 0,
      notes: "",
      priority: "medium",
      weather_dependent: false,
      equipment_needed: [],
      isMultiDay: false,
      numberOfDays: 1,
      repeatInterval: 1,
    });
    setShowScheduleModal(false);
    setEditingActivity(null);
  };

  const editActivity = (activity: FarmActivity) => {
    setEditingActivity(activity);
    setScheduleForm({
      activityType: activity.activityType,
      cropType: activity.cropType || "",
      date: activity.scheduledDate,
      time: activity.scheduledTime,
      duration: activity.duration || 60,
      location: activity.location.address,
      lat: activity.location.lat,
      lng: activity.location.lng,
      notes: activity.notes || "",
      priority: activity.priority,
      weather_dependent: activity.weather_dependent || false,
      equipment_needed: activity.equipment_needed || [],
      isMultiDay: false, // Editing is always single day
      numberOfDays: 1,
      repeatInterval: 1,
    });
    setShowScheduleModal(true);
  };

  const deleteActivity = (activityId: string) => {
    if (!currentUser) return;

    const updatedActivities = farmActivities.filter((activity) => activity.id !== activityId);
    setFarmActivities(updatedActivities);
    localStorage.setItem(
      `farmActivities_${currentUser.id}`,
      JSON.stringify(updatedActivities)
    );

    addNotification({
      type: "activity_reminder",
      title: "Activity Deleted",
      message: "A scheduled farm activity has been deleted.",
    });
  };

  const completeActivity = (activityId: string) => {
    if (!currentUser) return;

    const updatedActivities = farmActivities.map((activity) =>
      activity.id === activityId ? { ...activity, status: "completed" as const } : activity
    );
    setFarmActivities(updatedActivities);
    localStorage.setItem(
      `farmActivities_${currentUser.id}`,
      JSON.stringify(updatedActivities)
    );

    const completedActivity = farmActivities.find((activity) => activity.id === activityId);
    if (completedActivity) {
      const activityInfo = getActivityInfo(completedActivity.activityType);
      addNotification({
        type: "activity_completed",
        title: "Activity Completed",
        message: `${activityInfo.label} ${completedActivity.cropType ? `for ${completedActivity.cropType}` : ''} has been completed successfully.`,
        relatedActivityId: activityId,
      });
    }
  };

  const upcomingActivities = farmActivities
    .filter((activity) => activity.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.scheduledDate + "T" + a.scheduledTime).getTime() -
        new Date(b.scheduledDate + "T" + b.scheduledTime).getTime()
    );

  const completedActivities = farmActivities.filter(
    (activity) => activity.status === "completed"
  );

  return (
    <div className={styles.schedulePage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className={styles.backButton}
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className={styles.headerText}>
                <h1 className={styles.pageTitle}>Farm Activity Planner</h1>
                <p className={styles.pageSubtitle}>
                  Plan and manage all your farm activities
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingActivity(null);
              setScheduleForm({
                activityType: "",
                cropType: "",
                date: "",
                time: "",
                duration: 60,
                location: "",
                lat: 0,
                lng: 0,
                notes: "",
                priority: "medium",
                weather_dependent: false,
                equipment_needed: [],
                isMultiDay: false,
                numberOfDays: 1,
                repeatInterval: 1,
              });
              setShowScheduleModal(true);
            }}
            className={styles.addButton}
          >
            <Plus className="w-5 h-5" />
            <span>Schedule New Activity</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{upcomingActivities.length}</h3>
                <p className={styles.statLabel}>Upcoming Activities</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{completedActivities.length}</h3>
                <p className={styles.statLabel}>Completed Activities</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{farmActivities.length}</h3>
                <p className={styles.statLabel}>Total Planned</p>
              </div>
            </div>
          </div>

          {/* Upcoming Activities */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming Activities</h2>
            <div className={styles.scansList}>
              {upcomingActivities.length === 0 ? (
                <div className={styles.emptyState}>
                  <Calendar className="w-16 h-16 text-gray-300" />
                  <p className={styles.emptyText}>
                    No upcoming activities scheduled
                  </p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className={styles.emptyButton}
                  >
                    Schedule Your First Activity
                  </button>
                </div>
              ) : (
                upcomingActivities.map((activity) => (
                  <div key={activity.id} className={styles.scanCard}>
                    <div className={styles.scanHeader}>
                      <div className={styles.scanStatus}>
                        {(() => {
                          const info = getActivityInfo(activity.activityType);
                          const IconComponent = info.icon;
                          return (
                            <>
                              <IconComponent className={`w-5 h-5 ${info.color}`} />
                              <span className={styles.statusBadge}>
                                {activity.status === 'pending' ? 'Scheduled' : activity.status}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className={styles.scanActions}>
                        <button
                          onClick={() => editActivity(activity)}
                          className={styles.actionButton}
                          aria-label={`Edit ${getActivityInfo(activity.activityType).label} activity`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => completeActivity(activity.id)}
                          className={`${styles.actionButton} ${styles.completeButton}`}
                          aria-label={`Mark ${getActivityInfo(activity.activityType).label} as complete`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          aria-label={`Delete ${getActivityInfo(activity.activityType).label} activity`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={styles.scanContent}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h3 className={styles.scanTitle}>{getActivityInfo(activity.activityType).label}</h3>
                        {activity.cropType && (
                          <span className={styles.cropBadge}>{activity.cropType}</span>
                        )}
                        <span className={`${styles.priorityBadge} ${styles[`priority-${activity.priority}`]}`}>
                          {activity.priority} priority
                        </span>
                      </div>
                      <div className={styles.scanDetails}>
                        <div className={styles.scanDetail}>
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {new Date(activity.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.scanDetail}>
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{activity.scheduledTime} ({activity.duration || 60} min)</span>
                        </div>
                        <div className={styles.scanDetail}>
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{activity.location.address}</span>
                        </div>
                        {activity.weather_dependent && (
                          <div className={styles.scanDetail}>
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span>Weather dependent</span>
                          </div>
                        )}
                      </div>
                      {activity.notes && (
                        <div className={styles.scanNotes}>
                          <p>{activity.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Activities */}
          {completedActivities.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recently Completed</h2>
              <div className={styles.completedList}>
                {completedActivities.slice(0, 5).map((activity) => {
                  const activityInfo = getActivityInfo(activity.activityType);
                  const IconComponent = activityInfo.icon;
                  return (
                    <div key={activity.id} className={styles.completedItem}>
                      <div className={styles.completedIcon}>
                        <IconComponent className={`w-5 h-5 ${activityInfo.color}`} />
                      </div>
                      <div className={styles.completedContent}>
                        <h4 className={styles.completedTitle}>
                          {activityInfo.label} {activity.cropType && `- ${activity.cropType}`}
                        </h4>
                        <p className={styles.completedDate}>
                          {new Date(activity.scheduledDate).toLocaleDateString()} at{" "}
                          {activity.scheduledTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingActivity ? "Edit Activity" : "Schedule New Activity"}
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingActivity(null);
                }}
                className={styles.closeButton}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScheduleActivity();
              }}
            >
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="schedule-activityType"
                    className={styles.formLabel}
                  >
                    Activity Type *
                  </label>
                  <select
                    id="schedule-activityType"
                    value={scheduleForm.activityType}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        activityType: e.target.value as FarmActivity['activityType'],
                      })
                    }
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Select activity type</option>
                    <option value="scan">Crop Scan</option>
                    <option value="watering">Watering</option>
                    <option value="fertilizing">Fertilizing</option>
                    <option value="harvesting">Harvesting</option>
                    <option value="planting">Planting</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="pruning">Pruning</option>
                    <option value="maintenance">Equipment Maintenance</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="schedule-cropType"
                    className={styles.formLabel}
                  >
                    Crop Type {scheduleForm.activityType && !['maintenance'].includes(scheduleForm.activityType) ? '*' : ''}
                  </label>
                  <select
                    id="schedule-cropType"
                    value={scheduleForm.cropType}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        cropType: e.target.value,
                      })
                    }
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Select crop type</option>
                    <option value="Corn">Corn</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soybeans">Soybeans</option>
                    <option value="Rice">Rice</option>
                    <option value="Tomatoes">Tomatoes</option>
                    <option value="Potatoes">Potatoes</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sunflower">Sunflower</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="schedule-date" className={styles.formLabel}>
                    Date
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="schedule-time" className={styles.formLabel}>
                    Time
                  </label>
                  <input
                    id="schedule-time"
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, time: e.target.value })
                    }
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g., North Field, Section A"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="schedule-duration" className={styles.formLabel}>
                    Duration (minutes)
                  </label>
                  <input
                    id="schedule-duration"
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={scheduleForm.duration}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) || 60 })
                    }
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="schedule-priority" className={styles.formLabel}>
                    Priority
                  </label>
                  <select
                    id="schedule-priority"
                    value={scheduleForm.priority}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        priority: e.target.value as FarmActivity['priority'],
                      })
                    }
                    className={styles.formSelect}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={scheduleForm.weather_dependent}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, weather_dependent: e.target.checked })
                      }
                    />
                    Weather Dependent Activity
                  </label>
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>
                    Check if this activity should be postponed in bad weather
                  </small>
                </div>
              </div>
              {!editingActivity && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={scheduleForm.isMultiDay}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, isMultiDay: e.target.checked })
                        }
                      />
                      Schedule for Multiple Days
                    </label>
                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                      Check to repeat this activity over multiple days
                    </small>
                  </div>
                </div>
              )}
              {scheduleForm.isMultiDay && !editingActivity && (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="schedule-numberOfDays" className={styles.formLabel}>
                      Number of Days
                    </label>
                    <input
                      id="schedule-numberOfDays"
                      type="number"
                      min="2"
                      max="30"
                      value={scheduleForm.numberOfDays}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, numberOfDays: parseInt(e.target.value) || 1 })
                      }
                      className={styles.formInput}
                      required
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                      Total number of days to schedule this activity
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="schedule-repeatInterval" className={styles.formLabel}>
                      Repeat Every (Days)
                    </label>
                    <input
                      id="schedule-repeatInterval"
                      type="number"
                      min="1"
                      max="7"
                      value={scheduleForm.repeatInterval}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, repeatInterval: parseInt(e.target.value) || 1 })
                      }
                      className={styles.formInput}
                      required
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px' }}>
                      Days between each occurrence (1 = daily, 2 = every other day, etc.)
                    </small>
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes (Optional)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  placeholder="Any additional notes for the scan..."
                  rows={3}
                  className={styles.formTextarea}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingActivity(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !scheduleForm.activityType ||
                    !scheduleForm.date ||
                    !scheduleForm.time
                  }
                  className={styles.saveButton}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingActivity ? "Update Activity" : "Schedule Activity"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
