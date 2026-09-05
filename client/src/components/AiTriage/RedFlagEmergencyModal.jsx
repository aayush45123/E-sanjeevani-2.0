import React from "react";
import { AlertOctagon, PhoneCall, Hospital, X, ShieldAlert, AlertTriangle } from "lucide-react";
import styles from "./RedFlagEmergencyModal.module.css";

/**
 * RedFlagEmergencyModal
 * Hard-blocking emergency modal displayed when check_red_flags() returns true.
 * Visually interrupts the user's flow and directs them to immediate emergency care.
 */
export default function RedFlagEmergencyModal({
  isOpen,
  onClose,
  redFlags = [],
  message = "",
}) {
  if (!isOpen) return null;

  const defaultFlags =
    redFlags.length > 0
      ? redFlags
      : [
          "Critical red-flag symptoms detected",
          "Potential high-risk clinical deterioration",
        ];

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="emergency-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Pulsing emergency banner */}
        <div className={styles.alertHeader}>
          <div className={styles.iconCircle}>
            <AlertOctagon size={36} className={styles.alertIcon} />
          </div>
          <span className={styles.badgeCritical}>EMERGENCY ALERT</span>
          <h2 id="emergency-title" className={styles.title}>
            Immediate Medical Attention Required
          </h2>
          <p className={styles.subtitle}>
            Our clinical triage algorithm has identified potential high-risk warning signs in your reported symptoms.
          </p>
        </div>

        {/* Warning Details */}
        <div className={styles.contentBody}>
          <div className={styles.warningBox}>
            <div className={styles.warningBoxHeader}>
              <ShieldAlert size={18} className={styles.shieldIcon} />
              <span>Detected Red-Flag Indicators:</span>
            </div>
            <ul className={styles.flagsList}>
              {defaultFlags.map((flag, idx) => (
                <li key={idx} className={styles.flagItem}>
                  <span className={styles.redDot}></span>
                  <strong>{typeof flag === "string" ? flag : flag.name || "Warning sign"}</strong>
                </li>
              ))}
            </ul>
          </div>

          <p className={styles.instructionsText}>
            {message ||
              "Please do not wait for a routine online appointment. Seek emergency in-person medical care at your nearest hospital or contact emergency services immediately."}
          </p>

          {/* Emergency Helplines Direct Contact Buttons */}
          <div className={styles.actionGrid}>
            <a href="tel:112" className={styles.emergencyBtnPrimary}>
              <PhoneCall size={18} />
              <span>
                <strong>Call Emergency (112)</strong>
                <small>National Emergency Hotline</small>
              </span>
            </a>

            <a href="tel:108" className={styles.emergencyBtnSecondary}>
              <Hospital size={18} />
              <span>
                <strong>Call Ambulance (108)</strong>
                <small>Emergency Medical Response</small>
              </span>
            </a>
          </div>
        </div>

        {/* Modal Footer with acknowledge button */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.ackBtn}>
            I Understand &amp; Acknowledge Emergency Guidance
          </button>
        </div>
      </div>
    </div>
  );
}
