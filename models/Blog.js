import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: [true, "Admin name is required"],
    trim: true
  },
  url: {
    type: String,
    required: [true, "URL is required"],
    trim: true,
    unique: true
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true
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
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;

