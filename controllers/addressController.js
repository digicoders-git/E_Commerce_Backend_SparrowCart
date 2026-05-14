import Address from "../models/Address.js";

console.log("📦 Address model imported:", Address);
console.log("📦 Address model name:", Address.modelName);
console.log("📦 Address collection:", Address.collection.name);

// Helper to get userId from request
const getUserIdFromReq = (req) => {
  // Priority order: URL params -> JWT token -> query -> body
  let userId = null;
  
  // First try URL params (for routes like /my/:userId)
  if (req.params.userId) {
    userId = req.params.userId;
  }
  // Then try JWT token (authenticated user)
  else if (req.user?.dbId) {
    userId = req.user.dbId;
  } else if (req.user?.sub) {
    userId = req.user.sub;
  }
  // Fallback to query/body
  else if (req.query.userId) {
    userId = req.query.userId;
  } else if (req.body.userId) {
    userId = req.body.userId;
  }
  
  console.log("🔍 getUserIdFromReq - Sources:", {
    paramsUserId: req.params.userId,
    jwtDbId: req.user?.dbId,
    jwtSub: req.user?.sub,
    queryUserId: req.query.userId,
    bodyUserId: req.body.userId,
    finalUserId: userId
  });
  
  return typeof userId === "string" ? userId.trim() : userId;
};

// --------------------------------------
// POST /api/addresses
// Create a new address
// --------------------------------------
export const createAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const {
      type = "home",
      fullName,
      mobile,
      email = "",
      addressLine1,
      addressLine2 = "",
      landmark = "",
      city,
      state,
      pincode,
      country = "India",
      latitude,
      longitude,
      accuracy,
      formattedAddress,
      isDefault = false,
    } = req.body;

    // Required fields validation
    if (!fullName || !mobile || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        message: "fullName, mobile, addressLine1, city, state, and pincode are required.",
      });
    }

    // If setting as default, ensure it's the only default
    if (isDefault) {
      await Address.updateMany(
        { user: userId, isDeleted: false },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: userId,
      type,
      fullName,
      mobile,
      email,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      location: {
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        accuracy: accuracy !== undefined ? Number(accuracy) : undefined,
        formattedAddress,
      },
      isDefault,
    });

    return res.status(201).json({
      message: "Address created successfully",
      address,
    });
  } catch (err) {
    console.error("createAddress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------
// GET /api/addresses/my
// Get all addresses for current user
// --------------------------------------
export const getMyAddresses = async (req, res) => {
  console.log("🚀 === getMyAddresses START ===");
  
  try {
    console.log("📍 Step 1: Function called");
    console.log("📍 Step 2: req.method:", req.method);
    console.log("📍 Step 3: req.url:", req.url);
    console.log("📍 Step 4: req.query:", req.query);
    console.log("📍 Step 5: req.body:", req.body);
    console.log("📍 Step 6: req.user:", req.user);
    
    const userId = getUserIdFromReq(req);
    console.log("📍 Step 7: getUserId result:", userId);
    console.log("📍 Step 8: userId type:", typeof userId);
    
    if (!userId) {
      console.log("❌ Step 9: No userId - returning 400");
      return res.status(400).json({ message: "userId is required." });
    }

    console.log("🔍 Step 10: About to query database");
    console.log("🔍 Step 11: Address model:", !!Address);
    
    // Test basic query first
    console.log("🔍 Step 12: Testing Address.find({})");
    const allAddresses = await Address.find({}).limit(1);
    console.log("🔍 Step 13: All addresses test:", allAddresses.length);
    
    console.log("🔍 Step 14: Querying for user:", userId);
    const addresses = await Address.find({
      user: userId,
      isDeleted: false,
    }).sort({ isDefault: -1, createdAt: -1 });

    console.log("📍 Step 15: Query completed");
    console.log("📍 Step 16: Found addresses:", addresses.length);
    console.log("📍 Step 17: Addresses data:", addresses);

    console.log("📍 Step 18: Sending response");
    return res.json({
      addresses,
      count: addresses.length,
    });
  } catch (err) {
    console.error("❌ === ERROR in getMyAddresses ===");
    console.error("❌ Error name:", err.name);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    console.error("❌ Error code:", err.code);
    console.error("❌ Full error:", err);
    
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      errorName: err.name 
    });
  }
};

// --------------------------------------
// GET /api/addresses/my/default
// Get default address for current user
// --------------------------------------
export const getMyDefaultAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const address = await Address.findOne({
      user: userId,
      isDefault: true,
      isDeleted: false,
    });

    if (!address) {
      // Return first address if no default found
      const firstAddress = await Address.findOne({
        user: userId,
        isDeleted: false,
      }).sort({ createdAt: 1 });
      
      return res.json({ 
        address: firstAddress,
        isDefault: !!firstAddress 
      });
    }

    return res.json({ 
      address,
      isDefault: true 
    });
  } catch (err) {
    console.error("getMyDefaultAddress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------
// GET /api/addresses/:id
// Get specific address by ID
// --------------------------------------
export const getAddressById = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const address = await Address.findOne({
      _id: id,
      user: userId,
      isDeleted: false,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({ address });
  } catch (err) {
    console.error("getAddressById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------
// PATCH /api/addresses/:id
// Update address
// --------------------------------------
export const updateAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.user;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.createdAtIST;
    delete updateData.updatedAtIST;

    // If setting as default, update other addresses
    if (updateData.isDefault === true) {
      await Address.updateMany(
        { user: userId, isDeleted: false, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({
      message: "Address updated successfully",
      address,
    });
  } catch (err) {
    console.error("updateAddress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------
// PATCH /api/addresses/:id/set-default
// Set address as default
// --------------------------------------
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    // Start transaction-like operations
    await Address.updateMany(
      { user: userId, isDeleted: false },
      { isDefault: false }
    );

    const address = await Address.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({
      message: "Address set as default successfully",
      address,
    });
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------------------------------------
// DELETE /api/addresses/:id
// Soft delete address
// --------------------------------------
export const deleteAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, user: userId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const newDefault = await Address.findOne({
        user: userId,
        isDeleted: false,
      }).sort({ createdAt: 1 });

      if (newDefault) {
        await Address.findByIdAndUpdate(newDefault._id, { isDefault: true });
      }
    }

    return res.json({
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.error("deleteAddress error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};