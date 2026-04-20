// controllers/reviewController.js
import Review from "../models/Review.js";

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Public
 */
export const createReview = async (req, res) => {
  try {
    const { productId, userName, rating, comment, userId } = req.body;

    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const review = await Review.create({
      product: productId,
      user: userId || null,
      userName,
      rating,
      comment,
      status: "pending", // Always pending by default for admin approval
    });

    res.status(201).json({
      message: "Review submitted successfully! It will be visible after admin approval.",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

/**
 * @desc    Get approved reviews for a specific product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getApprovedReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId, status: "approved" })
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

/**
 * @desc    Get all approved reviews (for home page slider)
 * @route   GET /api/reviews/approved
 * @access  Public
 */
export const getAllApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: "approved" })
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .limit(10); // Limit to latest 10 for performance

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching all approved reviews:", error);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
};

/**
 * @desc    Get all reviews for admin moderation
 * @route   GET /api/reviews/admin
 * @access  Private (Admin)
 */
export const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("product", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews for moderation" });
  }
};

/**
 * @desc    Update review status (Approve/Reject)
 * @route   PUT /api/reviews/:id/status
 * @access  Private (Admin)
 */
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: `Review ${status} successfully`, review });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ message: "Failed to update review status" });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Admin)
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};
