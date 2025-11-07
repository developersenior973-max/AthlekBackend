import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

const updateProductReviewStats = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const stat = stats[0];

  await Product.findByIdAndUpdate(productId, {
    reviewRating: stat?.averageRating ?? 0,
    reviewCount: stat?.reviewCount ?? 0,
  });
};

// Get all reviews (admin dashboard)
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("product", "title images")
      .sort({ createdAt: -1 });
    
    res.json({ data: reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get approved reviews for public website
export const getPublicReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const reviews = await Review.find({
      product: productId,
      status: "approved"
    })
    .populate("product", "title")
    .sort({ createdAt: -1 });
    
    res.json({ data: reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new review (customer)
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, customerName, customerEmail } = req.body;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Create review with pending status
    const review = new Review({
      product: productId,
      customer: {
        name: customerName,
        email: customerEmail
      },
      rating,
      comment,
      status: "pending" // Default status - needs admin approval
    });
    
    await review.save();
    
    res.status(201).json({
      message: "Review submitted successfully and pending approval",
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve review (admin)
export const approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status: "approved",
        adminResponse,
        responseDate: new Date()
      },
      { new: true }
    ).populate("product", "title");
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    await updateProductReviewStats(review.product._id || review.product);

    res.json({
      message: "Review approved successfully",
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject review (admin)
export const rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status: "rejected",
        adminResponse,
        responseDate: new Date()
      },
      { new: true }
    ).populate("product", "title");
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    await updateProductReviewStats(review.product._id || review.product);

    res.json({
      message: "Review rejected successfully",
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update review (admin)
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate("product", "title");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await updateProductReviewStats(review.product._id || review.product);

    res.json({
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get review statistics
export const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsMap = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });
    
    res.json({ data: statsMap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 