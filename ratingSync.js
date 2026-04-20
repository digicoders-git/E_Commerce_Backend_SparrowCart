import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Review from "./models/Review.js";

dotenv.config();

const syncRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for rating sync...");

    const products = await Product.find({ isDeleted: false });
    console.log(`Found ${products.length} products to sync.`);

    for (const product of products) {
      const reviews = await Review.find({ product: product._id, status: "approved" });
      const numReviews = reviews.length;
      let avgRating = 0;

      if (numReviews > 0) {
        const sum = reviews.reduce((acc, current) => acc + current.rating, 0);
        avgRating = sum / numReviews;
      }

      await Product.findByIdAndUpdate(product._id, {
        rating: Number(avgRating.toFixed(1)),
        numReviews: numReviews,
      });

      console.log(`Synced ${product.name}: ${avgRating.toFixed(1)} stars, ${numReviews} reviews`);
    }

    console.log("Rating synchronization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during rating sync:", error);
    process.exit(1);
  }
};

syncRatings();
