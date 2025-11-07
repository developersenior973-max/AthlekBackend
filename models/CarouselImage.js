import mongoose from "mongoose";

const carouselImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
carouselImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CarouselImage = mongoose.model("CarouselImage", carouselImageSchema);

export default CarouselImage;

