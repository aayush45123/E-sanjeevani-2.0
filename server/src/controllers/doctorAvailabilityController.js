import DoctorAvailability from "../models/DoctorAvailability.js";
import User from "../models/User.js";

/*
==================================================
CREATE DOCTOR AVAILABILITY
Doctor sets available slots for a specific day
==================================================
*/

export const createDoctorAvailability = async (req, res) => {
  try {
    const { availableDate, slots } = req.body;

    /*
    Example Body:

    {
      "availableDate": "2026-05-01",
      "slots": [
        {
          "startTime": "10:00",
          "endTime": "10:30"
        },
        {
          "startTime": "10:30",
          "endTime": "11:00"
        }
      ]
    }
    */

    /*
    ==========================================
    VALIDATE ROLE
    ==========================================
    */

    const doctor = await User.findById(req.user.id);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create availability",
      });
    }

    /*
    ==========================================
    BASIC VALIDATION
    ==========================================
    */

    if (
      !availableDate ||
      !slots ||
      !Array.isArray(slots) ||
      slots.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "availableDate and slots are required",
      });
    }

    /*
    ==========================================
    CHECK EXISTING ENTRY
    ==========================================
    */

    const selectedDate = new Date(availableDate);

    let availability = await DoctorAvailability.findOne({
      doctor: req.user.id,
      availableDate: selectedDate,
    });

    /*
    ==========================================
    UPDATE EXISTING DATE
    ==========================================
    */

    if (availability) {
      availability.slots = slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        bookedBy: null,
        consultationId: null,
      }));

      await availability.save();

      return res.json({
        success: true,
        message: "Availability updated successfully",
        availability,
      });
    }

    /*
    ==========================================
    CREATE NEW ENTRY
    ==========================================
    */

    availability = new DoctorAvailability({
      doctor: req.user.id,
      availableDate: selectedDate,
      slots: slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        bookedBy: null,
        consultationId: null,
      })),
    });

    await availability.save();

    res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    console.error("createDoctorAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create doctor availability",
      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTOR OWN AVAILABILITY
Doctor dashboard
==================================================
*/

export const getDoctorOwnAvailability = async (req, res) => {
  try {
    const availability = await DoctorAvailability.find({
      doctor: req.user.id,
      isActive: true,
    }).sort({
      availableDate: 1,
    });

    res.json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("getDoctorOwnAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability",
      error: error.message,
    });
  }
};

/*
==================================================
DELETE SINGLE DAY AVAILABILITY
Optional professional feature
==================================================
*/

export const deleteDoctorAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;

    const availability = await DoctorAvailability.findById(availabilityId);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    if (availability.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    availability.isActive = false;

    await availability.save();

    res.json({
      success: true,
      message: "Availability removed successfully",
    });
  } catch (error) {
    console.error("deleteDoctorAvailability error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete availability",
      error: error.message,
    });
  }
};
