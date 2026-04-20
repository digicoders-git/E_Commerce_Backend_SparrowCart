// routes/offerTextRoutes.js
import express from "express";
import {
  createOfferText,
  getActiveOfferTexts,
  adminListOfferTexts,
  getOfferTextById,
  updateOfferText,
  updateOfferTextStatus,
  deleteOfferText,
  validateOfferCoupon,
} from "../controllers/offerTextController.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = express.Router();

// ── Public ───────────────────────────────────────────────────────────────────
// GET active offer texts (for frontend display)
router.get("/", getActiveOfferTexts);

// POST validate coupon code (used by frontend cart/checkout)
// body: { code, cartTotal }
router.post("/validate-coupon", validateOfferCoupon);

// ── Admin ────────────────────────────────────────────────────────────────────
router.get("/admin", requireAdminAuth, adminListOfferTexts);
router.post("/", requireAdminAuth, createOfferText);
router.patch("/:id/status", requireAdminAuth, updateOfferTextStatus);
router.patch("/:id", requireAdminAuth, updateOfferText);
router.delete("/:id", requireAdminAuth, deleteOfferText);

// Public/Admin both
router.get("/:id", getOfferTextById);

export default router;
