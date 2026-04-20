// models/OfferText.js
import mongoose from "mongoose";

const offerTextSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ── Optional Coupon / Offer Code ──────────────────────────────────────
    hasCoupon: {
      type: Boolean,
      default: false,
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
      sparse: true, // allows multiple null values with unique index
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,   // 0 = no cap
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,   // 0 = no minimum
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 0,   // 0 = unlimited
      min: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ─────────────────────────────────────────────────────────────────────

    createdAtIST: { type: String },
    updatedAtIST: { type: String },
  },
  { timestamps: true }
);

// IST timestamps
offerTextSchema.pre("save", function (next) {
  const istTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });

  if (this.isNew && !this.createdAtIST) {
    this.createdAtIST = istTime;
  }
  this.updatedAtIST = istTime;
  next();
});

offerTextSchema.pre("findOneAndUpdate", function (next) {
  const istTime = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });

  this.set({ updatedAtIST: istTime });
  next();
});

export default mongoose.model("OfferText", offerTextSchema);
