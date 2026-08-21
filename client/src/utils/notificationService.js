import React from "react";
import toast from "react-hot-toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Notification Service with Sound Alerts and Vibration
// This service handles desktop notifications, sound alerts, and vibration

export class NotificationService {
  // Check if browser supports Notification API
  static isSupported() {
    return "Notification" in window;
  }

  // Request permission for notifications
  static async requestPermission() {
    if (!this.isSupported()) {
      console.warn("Notification API not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  // Play notification sound
  static playSound(soundType = "alert") {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (soundType === "alert") {
        // High-pitched alert beep
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (soundType === "success") {
        // Pleasant success sound (two beeps)
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3,
        );
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);

        // Second beep
        const osc2 = audioContext.createOscillator();
        osc2.connect(gainNode);
        osc2.frequency.value = 800;
        osc2.start(audioContext.currentTime + 0.35);
        osc2.stop(audioContext.currentTime + 0.65);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }

  // Trigger vibration
  static vibrate(pattern = [200, 100, 200]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // Show desktop notification
  static async showNotification(
    title,
    options = {},
  ) {
    if (!this.isSupported()) {
      console.warn("Notifications not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      await this.requestPermission();
    }

    try {
      const notification = new Notification(title, {
        icon: "/E-Sanjeevani-logo.png",
        badge: "/E-Sanjeevani-logo.png",
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  // User joined notification
  static async userJoinedNotification(userName, userRole) {
    const title = `${userRole === "doctor" ? "Dr." : ""} ${userName} has joined!`;
    const body =
      userRole === "doctor"
        ? "The doctor has joined the consultation. You can now start."
        : "The patient has joined the consultation. You can now start.";

    // Play alert sound
    this.playSound("alert");

    // Vibrate (3 short vibrations)
    this.vibrate([100, 50, 100, 50, 100]);

    // Show notification
    await this.showNotification(title, {
      body: body,
      tag: "user-joined",
      requireInteraction: true,
      actions: [
        {
          action: "open",
          title: "Open Consultation",
        },
      ],
    });
  }

  // Appointment reminder notification
  static async appointmentReminderNotification(doctorName) {
    const title = "Appointment Time!";
    const body = `Your consultation with Dr. ${doctorName} is starting now. Please join immediately!`;

    // Play alert sound
    this.playSound("alert");

    // Vibrate (repeated pattern to get attention)
    this.vibrate([200, 100, 200, 100, 200]);

    // Show notification
    await this.showNotification(title, {
      body: body,
      tag: "appointment-reminder",
      requireInteraction: true,
      badge: "/E-Sanjeevani-logo.png",
    });
  }

  // In-app toast-style notification (for UI display)
  static showToast(message, type = "info", duration = 3500) {
    if (!message) return;

    // Strip leading emojis from message text if present (e.g. "⏳ " or "✅ ")
    const cleanMessage =
      typeof message === "string"
        ? message.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}⏳✅🔴🔔📢]+\s*/u, "")
        : message;

    const opts = { duration };
    if (type === "success") {
      toast.success(cleanMessage, {
        ...opts,
        icon: React.createElement(CheckCircle2, { size: 18, color: "#0ea5a4" }),
      });
    } else if (type === "error") {
      toast.error(cleanMessage, {
        ...opts,
        icon: React.createElement(AlertCircle, { size: 18, color: "#ef4444" }),
      });
    } else if (type === "warning") {
      toast(cleanMessage, {
        ...opts,
        icon: React.createElement(AlertTriangle, { size: 18, color: "#f59e0b" }),
        style: {
          borderLeft: "4px solid #f59e0b",
        },
      });
    } else {
      toast(cleanMessage, {
        ...opts,
        icon: React.createElement(Info, { size: 18, color: "#0ea5a4" }),
      });
    }
  }
}

export default NotificationService;
