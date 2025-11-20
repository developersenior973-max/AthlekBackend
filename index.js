import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import bundleRoutes from "./routes/bundleRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import carouselImageRoutes from "./routes/carouselImageRoutes.js";

// Import middleware
import { initializeUsers } from "./middleware/auth.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce_admin";

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    'https://34.18.0.53',
    'http://34.18.0.53:3000',
    'http://34.18.0.53:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://34.18.0.53:3001',
    'http://34.18.0.53:3000',
    'https://www.athlekt.com',
    'https://athlekt.com'
    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Serve static files from uploads directory with CORS headers
app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static("uploads"));

// Debug environment variables
console.log("🔍 Environment Debug:");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "***SET***" : "NOT SET");

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/form", formRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/carousel-images", carouselImageRoutes);

// Public product routes (no authentication required)
app.use("/api/public/products", productRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Increase server timeout for large file uploads (30 minutes)
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize default users on first run
  initializeUsers();
});

// Set server timeout to 30 minutes for large file uploads
server.timeout = 30 * 60 * 1000; // 30 minutes
server.keepAliveTimeout = 30 * 60 * 1000; // 30 minutes
