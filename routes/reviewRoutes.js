// routes/reviewRoutes.js
import express from "express";
import {
  createReview,
  getApprovedReviewsByProduct,
  getAllApprovedReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

// Public routes
router.post("/", createReview);
router.get("/approved", getAllApprovedReviews);
router.get("/product/:productId", getApprovedReviewsByProduct);

// Admin routes (In a real app, protect these with auth middleware)
router.get("/admin", getAdminReviews);
router.put("/:id/status", updateReviewStatus);
router.delete("/:id", deleteReview);

export default router;
