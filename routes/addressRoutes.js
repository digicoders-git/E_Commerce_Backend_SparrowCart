import express from "express";
import {
  createAddress,
  getMyAddresses,
  getMyDefaultAddress,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { requireUserAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/addresses - Create new address (auth optional for now)
router.post("/", createAddress);

// GET /api/addresses/my/default - Get default address
router.get("/my/default", requireUserAuth, getMyDefaultAddress);

// GET /api/addresses/my - Get user's addresses via query parameter (no auth for now)
router.get("/my", getMyAddresses);

// GET /api/addresses/my/:userId - Get user's addresses via URL params (no auth for now)
router.get("/my/:userId", getMyAddresses);

// GET /api/addresses/:id - Get address by ID
router.get("/:id", requireUserAuth, getAddressById);

// PATCH /api/addresses/:id - Update address
router.patch("/:id", requireUserAuth, updateAddress);

// PATCH /api/addresses/:id/set-default - Set as default
router.patch("/:id/set-default", requireUserAuth, setDefaultAddress);

// DELETE /api/addresses/:id - Delete address
router.delete("/:id", requireUserAuth, deleteAddress);

export default router;