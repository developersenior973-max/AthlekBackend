import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: false,
      },
      productName: {
        type: String,
        required: true,
      },
      variant: {
        size: String,
        color: String,
        sku: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      // Bundle-specific fields
      isBundle: {
        type: Boolean,
        default: false,
      },
      bundleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bundle",
      },
      bundleDetails: {
        selectedPack: {
          name: String,
          quantity: Number,
          totalPrice: Number,
          pricePerItem: Number,
          tag: String,
        },
        selectedSize: String,
        selectedLength: String,
        selectedColor: {
          name: String,
          description: String,
        },
        dealTag: String,
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  bundleDiscount: {
    type: Number,
    default: 0,
  },
  appliedBundle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bundle",
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  shippingMethod: {
    type: String,
    default: "Standard Shipping",
  },
  trackingNumber: {
    type: String,
  },
  notes: {
    type: String,
  },
  isFreeShipping: {
    type: Boolean,
    default: false,
  },
  // Payment Gateway Integration
  paymentGateway: {
    type: String,
    enum: ["ngenius", "manual"],
    default: "manual"
  },
  paymentGatewayOrderId: {
    type: String, // N-Genius order ID
  },
  paymentGatewayTransactionId: {
    type: String, // N-Genius transaction ID
  },
  paymentUrl: {
    type: String, // N-Genius payment URL
  },
  paymentGatewayStatus: {
    type: String,
    enum: ["pending", "captured", "failed", "cancelled"],
    default: "pending"
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed, // Store full N-Genius response
  }
}, {
  timestamps: true,
});

export default mongoose.model("Order", orderSchema); 