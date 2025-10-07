"use client";

import { useState, useEffect } from "react";
import { reminderManager, Reminder } from "../../utils/reminderManager";
import styles from "./Reminders.module.css";
import { Bell, Check, X, Clock, AlertCircle } from "lucide-react";

interface RemindersPanelProps {
  userId: string;
  compact?: boolean;
}

export default function RemindersPanel({ userId, compact = false }: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<"all" | "urgent" | "high" | "overdue">("all");
  const [counts, setCounts] = useState<any>(null);

  useEffect(() => {
    loadReminders();
    // Refresh every minute
    const interval = setInterval(loadReminders, 60000);
    return () => clearInterval(interval);
  }, [userId, filter]);

  const loadReminders = () => {
    let filtered: Reminder[];

    switch (filter) {
      case "urgent":
        filtered = reminderManager.getActiveReminders(userId).filter(r => r.priority === "urgent");
        break;
      case "high":
        filtered = reminderManager.getActiveReminders(userId).filter(r => r.priority === "high");
        break;
      case "overdue":
        filtered = reminderManager.getOverdueReminders(userId);
        break;
      default:
        filtered = reminderManager.getActiveReminders(userId);
    }

    setReminders(filtered);
    setCounts(reminderManager.getReminderCounts(userId));
  };

  const handleComplete = (reminderId: string) => {
    reminderManager.completeReminder(userId, reminderId);
    loadReminders();
  };

  const handleDelete = (reminderId: string) => {
    reminderManager.deleteReminder(userId, reminderId);
    loadReminders();
  };

  const handleSnooze = (reminderId: string, hours: number) => {
    reminderManager.snoozeReminder(userId, reminderId, hours);
    loadReminders();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#dc2626";
      case "high":
        return "#f59e0b";
      case "normal":
        return "#10b981";
      case "low":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "treatment":
        return "💊";
      case "weather":
        return "🌤️";
      case "harvest":
        return "🌾";
      case "supply":
        return "📦";
      case "seasonal":
        return "📅";
      case "rescan":
        return "📸";
      default:
        return "🔔";
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      // Overdue
      if (days > 0) return `${days} day${days > 1 ? "s" : ""} overdue`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} overdue`;
      return "Just now";
    } else {
      // Upcoming
      if (days > 0) return `In ${days} day${days > 1 ? "s" : ""}`;
      if (hours > 0) return `In ${hours} hour${hours > 1 ? "s" : ""}`;
      return "Soon";
    }
  };

  if (compact) {
    // Compact version for dashboard header
    const overdueCount = counts?.overdue || 0;
    const urgentCount = counts?.urgent || 0;

    return (
      <div className={styles.compactBadge}>
        <Bell className="w-5 h-5" />
        {(overdueCount + urgentCount) > 0 && (
          <span className={styles.badge}>{overdueCount + urgentCount}</span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>🔔 Smart Reminders</h2>
          <p>Stay on top of your farming tasks</p>
        </div>
      </div>

      {counts && (
        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === "urgent" ? styles.active : ""}`}
            onClick={() => setFilter("urgent")}
          >
            Urgent ({counts.urgent})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === "overdue" ? styles.active : ""}`}
            onClick={() => setFilter("overdue")}
          >
            Overdue ({counts.overdue})
          </button>
        </div>
      )}

      <div className={styles.remindersList}>
        {reminders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              {filter === "overdue" ? "✅" : "📋"}
            </div>
            <p>
              {filter === "overdue"
                ? "All caught up! No overdue tasks"
                : "No reminders yet"}
            </p>
            <p className={styles.emptyHint}>
              Reminders are created automatically when you analyze crops
            </p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const isOverdue = reminder.scheduledFor < new Date();
            return (
              <div
                key={reminder.id}
                className={`${styles.reminderCard} ${isOverdue ? styles.overdue : ""}`}
              >
                <div className={styles.reminderHeader}>
                  <div className={styles.reminderIcon}>
                    {getTypeIcon(reminder.type)}
                  </div>
                  <div className={styles.reminderContent}>
                    <div className={styles.reminderTitle}>
                      {reminder.title}
                      {isOverdue && (
                        <span className={styles.overdueLabel}>
                          <AlertCircle className="w-4 h-4" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <div
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(reminder.priority) }}
                    >
                      {reminder.priority.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className={styles.reminderMessage}>{reminder.message}</div>

                <div className={styles.reminderFooter}>
                  <div className={styles.reminderTime}>
                    <Clock className="w-4 h-4" />
                    {getRelativeTime(reminder.scheduledFor)}
                  </div>
                  <div className={styles.reminderActions}>
                    {!isOverdue && (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleSnooze(reminder.id, 24)}
                        title="Snooze for 24 hours"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.completeBtn}`}
                      onClick={() => handleComplete(reminder.id)}
                      title="Mark as complete"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(reminder.id)}
                      title="Delete reminder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
