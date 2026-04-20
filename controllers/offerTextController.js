// controllers/offerTextController.js
import OfferText from "../models/OfferText.js";

// ── Helper: calculate discount amount ────────────────────────────────────────
export const calculateCouponDiscount = (offerText, cartTotal) => {
  if (!offerText.hasCoupon || !offerText.isActive) return 0;

  let discountAmount = 0;
  if (offerText.discountType === "percentage") {
    discountAmount = Math.round((cartTotal * offerText.discountValue) / 100);
    if (offerText.maxDiscount > 0 && discountAmount > offerText.maxDiscount) {
      discountAmount = offerText.maxDiscount;
    }
  } else if (offerText.discountType === "fixed") {
    discountAmount = offerText.discountValue;
  }

  if (discountAmount > cartTotal) discountAmount = cartTotal;
  return Math.round(discountAmount);
};

// ── POST /api/offer-texts  (admin) - create ──────────────────────────────────
export const createOfferText = async (req, res) => {
  try {
    const {
      text,
      isActive,
      // Coupon fields (optional)
      hasCoupon,
      couponCode,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "text is required." });
    }

    // If hasCoupon, validate couponCode uniqueness
    const hasCouponBool = hasCoupon === true || hasCoupon === "true";
    if (hasCouponBool && couponCode) {
      const existing = await OfferText.findOne({
        couponCode: couponCode.trim().toUpperCase(),
        isDeleted: false,
      }).lean();
      if (existing) {
        return res.status(409).json({
          message: `Coupon code "${couponCode.toUpperCase()}" already exists.`,
        });
      }
    }

    const offerText = await OfferText.create({
      text: text.trim(),
      isActive:
        isActive === undefined
          ? true
          : typeof isActive === "string"
          ? isActive === "true"
          : !!isActive,
      hasCoupon: hasCouponBool,
      couponCode: hasCouponBool && couponCode ? couponCode.trim().toUpperCase() : null,
      discountType: discountType || "percentage",
      discountValue: hasCouponBool ? Number(discountValue || 0) : 0,
      maxDiscount: hasCouponBool ? Number(maxDiscount || 0) : 0,
      minOrderAmount: hasCouponBool ? Number(minOrderAmount || 0) : 0,
      usageLimit: hasCouponBool ? Number(usageLimit || 0) : 0,
      usageCount: 0,
    });

    return res.status(201).json({
      message: "Offer text created successfully",
      offerText,
    });
  } catch (err) {
    console.error("createOfferText error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/offer-texts  (public) - active only ─────────────────────────────
export const getActiveOfferTexts = async (_req, res) => {
  try {
    const texts = await OfferText.find({
      isActive: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ offerTexts: texts });
  } catch (err) {
    console.error("getActiveOfferTexts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/offer-texts/admin  (admin) ──────────────────────────────────────
export const adminListOfferTexts = async (_req, res) => {
  try {
    const texts = await OfferText.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ offerTexts: texts });
  } catch (err) {
    console.error("adminListOfferTexts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /api/offer-texts/:id  (admin/public) ─────────────────────────────────
export const getOfferTextById = async (req, res) => {
  try {
    const text = await OfferText.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).lean();

    if (!text) {
      return res.status(404).json({ message: "Offer text not found" });
    }

    return res.json({ offerText: text });
  } catch (err) {
    console.error("getOfferTextById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PATCH /api/offer-texts/:id  (admin) ──────────────────────────────────────
export const updateOfferText = async (req, res) => {
  try {
    const update = {};

    if (req.body.text !== undefined) {
      if (!req.body.text.trim()) {
        return res.status(400).json({ message: "text cannot be empty string." });
      }
      update.text = req.body.text.trim();
    }

    if (req.body.isActive !== undefined) {
      update.isActive =
        typeof req.body.isActive === "string"
          ? req.body.isActive === "true"
          : !!req.body.isActive;
    }

    // Coupon fields update
    const hasCouponBool =
      req.body.hasCoupon === true || req.body.hasCoupon === "true";

    if (req.body.hasCoupon !== undefined) {
      update.hasCoupon = hasCouponBool;
    }

    if (req.body.couponCode !== undefined) {
      const newCode = req.body.couponCode?.trim().toUpperCase() || null;
      if (newCode) {
        const existing = await OfferText.findOne({
          couponCode: newCode,
          isDeleted: false,
          _id: { $ne: req.params.id },
        }).lean();
        if (existing) {
          return res.status(409).json({
            message: `Coupon code "${newCode}" already exists on another offer.`,
          });
        }
      }
      update.couponCode = newCode;
    }

    if (req.body.discountType !== undefined) update.discountType = req.body.discountType;
    if (req.body.discountValue !== undefined) update.discountValue = Number(req.body.discountValue);
    if (req.body.maxDiscount !== undefined) update.maxDiscount = Number(req.body.maxDiscount);
    if (req.body.minOrderAmount !== undefined) update.minOrderAmount = Number(req.body.minOrderAmount);
    if (req.body.usageLimit !== undefined) update.usageLimit = Number(req.body.usageLimit);

    const text = await OfferText.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      update,
      { new: true }
    ).lean();

    if (!text) {
      return res.status(404).json({ message: "Offer text not found" });
    }

    return res.json({
      message: "Offer text updated successfully",
      offerText: text,
    });
  } catch (err) {
    console.error("updateOfferText error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PATCH /api/offer-texts/:id/status  (admin) ───────────────────────────────
export const updateOfferTextStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false." });
    }

    const text = await OfferText.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isActive },
      { new: true }
    ).lean();

    if (!text) {
      return res.status(404).json({ message: "Offer text not found" });
    }

    return res.json({
      message: `Offer text ${isActive ? "activated" : "deactivated"} successfully`,
      offerText: text,
    });
  } catch (err) {
    console.error("updateOfferTextStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE /api/offer-texts/:id  (admin) - soft delete ───────────────────────
export const deleteOfferText = async (req, res) => {
  try {
    const text = await OfferText.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    ).lean();

    if (!text) {
      return res.status(404).json({ message: "Offer text not found" });
    }

    return res.json({
      message: "Offer text deleted (soft) successfully",
    });
  } catch (err) {
    console.error("deleteOfferText error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ── POST /api/offer-texts/validate-coupon  (public) ─────────────────────────
// body: { code, cartTotal }
export const validateOfferCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, message: "Coupon code is required." });
    }
    if (cartTotal === undefined || isNaN(Number(cartTotal))) {
      return res.status(400).json({ valid: false, message: "cartTotal is required." });
    }

    const total = Number(cartTotal);

    const offerText = await OfferText.findOne({
      couponCode: code.trim().toUpperCase(),
      hasCoupon: true,
      isDeleted: false,
    }).lean();

    if (!offerText) {
      return res.status(404).json({
        valid: false,
        message: "Invalid coupon code. Please check and try again.",
      });
    }

    if (!offerText.isActive) {
      return res.status(400).json({
        valid: false,
        message: "This coupon has expired or been deactivated.",
      });
    }

    if (offerText.usageLimit > 0 && offerText.usageCount >= offerText.usageLimit) {
      return res.status(400).json({
        valid: false,
        message: "This coupon's usage limit has been reached.",
      });
    }

    if (offerText.minOrderAmount > 0 && total < offerText.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of ₹${offerText.minOrderAmount} is required to use this coupon.`,
      });
    }

    const discountAmount = calculateCouponDiscount(offerText, total);
    const finalTotal = Math.max(0, total - discountAmount);

    return res.json({
      valid: true,
      message: "Coupon applied successfully!",
      coupon: {
        _id: offerText._id,
        code: offerText.couponCode,
        discountType: offerText.discountType,
        discountValue: offerText.discountValue,
        maxDiscount: offerText.maxDiscount,
        minOrderAmount: offerText.minOrderAmount,
        usageLimit: offerText.usageLimit,
        usageCount: offerText.usageCount,
        offerText: offerText.text,
      },
      discountAmount,
      finalTotal,
    });
  } catch (err) {
    console.error("validateOfferCoupon error:", err);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
};
