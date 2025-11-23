import mongoose from "mongoose";

const shippingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    enum: ['US', 'UAE', 'INTL', 'EU', 'ASIA', 'GLOBAL'], // YAHAN UAE ADD KAREN
    default: 'US'
  },
  minWeight: {
    type: Number,
    default: 0
  },
  maxWeight: {
    type: Number,
    default: 100
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxOrderAmount: {
    type: Number,
    default: 10000
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 9.99
  },
  freeShippingAt: {
    type: Number,
    default: 50
  },
  deliveryDays: {
    type: Number,
    required: true,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model("ShippingRule", shippingRuleSchema); 