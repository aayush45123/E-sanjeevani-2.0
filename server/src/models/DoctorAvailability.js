import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true, // example: "10:00"
    },
    endTime: {
      type: String,
      required: true, // example: "10:30"
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      default: null,
    },
  },
  { _id: true },
);

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: false,
    },

    availableDate: {
      type: Date,
      required: true,
    },

    slots: [slotSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

doctorAvailabilitySchema.index({
  doctor: 1,
  availableDate: 1,
});

export default mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
