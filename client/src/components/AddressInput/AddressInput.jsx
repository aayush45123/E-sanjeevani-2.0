import React, { useState } from "react";
import { FiMapPin, FiLoader } from "react-icons/fi";
import styles from "./AddressInput.module.css";

/**
 * AddressInput Component
 * Industry-level structured address input with optional geolocation
 *
 * Props:
 * - label: Section label (e.g., "Patient Address", "Clinic Address")
 * - address: Object with {apartment, street, district, city, pinCode, state}
 * - coordinates: {latitude, longitude} (optional)
 * - onChange: Callback function (address, coordinates) => void
 * - onLocationSelect: Callback for geolocation (optional)
 * - showGeolocation: Boolean to show "Get Current Location" button (default: true)
 * - required: Boolean to mark fields as required (default: false)
 */
export default function AddressInput({
  label = "Address",
  address = {},
  coordinates = {},
  onChange,
  onLocationSelect,
  showGeolocation = true,
  required = false,
}) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const handleAddressChange = (field, value) => {
    const updatedAddress = {
      apartment: address.apartment || "",
      street: address.street || "",
      district: address.district || "",
      city: address.city || "",
      pinCode: address.pinCode || "",
      state: address.state || "",
      ...address,
      [field]: value,
    };
    onChange(updatedAddress, coordinates);
  };

  const handleGetLocation = async () => {
    setGeoLoading(true);
    setGeoError("");

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoordinates = { latitude, longitude };
        onChange(address, newCoordinates);
        if (onLocationSelect) {
          onLocationSelect(newCoordinates);
        }
        setGeoLoading(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location unavailable";
        }
        setGeoError(errorMessage);
        setGeoLoading(false);
      },
    );
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  return (
    <div className={styles.addressContainer}>
      <div className={styles.header}>
        <h3 className={styles.label}>{label}</h3>
        {showGeolocation && (
          <button
            type="button"
            className={styles.geoButton}
            onClick={handleGetLocation}
            disabled={geoLoading}
            title="Auto-fill location from GPS"
          >
            {geoLoading ? (
              <>
                <FiLoader className={styles.spinner} size={16} />
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <FiMapPin size={16} />
                <span>Use Current Location</span>
              </>
            )}
          </button>
        )}
      </div>

      {geoError && <div className={styles.errorMessage}>{geoError}</div>}

      {coordinates?.latitude && coordinates?.longitude && (
        <div className={styles.coordinateDisplay}>
          📍 {coordinates.latitude.toFixed(4)},{" "}
          {coordinates.longitude.toFixed(4)}
        </div>
      )}

      <div className={styles.formGrid}>
        {/* Apartment */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Apartment / House No.
            {required && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g., Apt 101, House No. 42"
            className={styles.input}
            value={address.apartment || ""}
            onChange={(e) => handleAddressChange("apartment", e.target.value)}
            required={required}
          />
        </div>

        {/* Street */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Street / Road Name
            {required && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g., Main Street, Park Road"
            className={styles.input}
            value={address.street || ""}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            required={required}
          />
        </div>

        {/* District */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            District / Area
            {required && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g., Downtown, Midtown, Suburbs"
            className={styles.input}
            value={address.district || ""}
            onChange={(e) => handleAddressChange("district", e.target.value)}
            required={required}
          />
        </div>

        {/* City */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            City
            {required && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g., New York, Mumbai, Delhi"
            className={styles.input}
            value={address.city || ""}
            onChange={(e) => handleAddressChange("city", e.target.value)}
            required={required}
          />
        </div>

        {/* Pin Code */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Pin Code / Postal Code
            {required && <span className={styles.required}>*</span>}
          </label>
          <input
            type="text"
            placeholder="e.g., 100001, 400001"
            className={styles.input}
            value={address.pinCode || ""}
            onChange={(e) => handleAddressChange("pinCode", e.target.value)}
            required={required}
            pattern="[0-9]*"
          />
        </div>

        {/* State */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            State / Province
            {required && <span className={styles.required}>*</span>}
          </label>
          <select
            className={styles.select}
            value={address.state || ""}
            onChange={(e) => handleAddressChange("state", e.target.value)}
            required={required}
          >
            <option value="">Select State</option>
            {indianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
