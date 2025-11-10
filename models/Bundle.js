import mongoose from "mongoose";

const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productSlug: {
    type: String,
    required: false,
  },
  heroImage: {
    type: String,
    required: false,
    default: null,
  },
  galleryImages: {
    type: [String],
    default: [],
  },
  badgeText: {
    type: String,
    required: false,
  },
  shortDescription: {
    type: String,
    required: false,
  },
  ratingValue: {
    type: Number,
    required: false,
  },
  reviewsCount: {
    type: Number,
    required: false,
  },
  basePrice: {
    type: Number,
    required: false,
  },
  discountedPrice: {
    type: Number,
    required: false,
  },
  finalPrice: {
    type: Number,
    required: false,
  },
  dealTag: {
    type: String,
    required: false,
  },
  colorOptions: [
    {
      name: { type: String, required: true },
      description: { type: String },
      thumbnailImage: { type: String },
      galleryImages: [{ type: String }],
      badge: { type: String },
    },
  ],
  packOptions: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      pricePerItem: { type: Number },
      tag: { type: String },
      thumbnailImage: { type: String },
    },
  ],
  sizeOptions: [{ type: String }],
  sizePriceVariation: {
    type: Map,
    of: Number,
    default: {},
  },
  lengthOptions: [{ type: String }],
  guarantees: [
    {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
    },
  ],
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  originalPrice: Number,
  bundlePrice: {
    type: Number,
    required: true,
  },
  bundleType: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: false,
  },
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;
