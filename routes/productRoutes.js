import express from "express";
import multer from "multer";
import path from "path";
import {
  getProducts,
  getPublicProducts,
  getProduct,
  getPublicProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getProductStats
} from "../controllers/productController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public product routes (no authentication required) - MUST come before /:id routes
router.get('/public/all', getPublicProducts);
router.get('/public/:id', getPublicProduct);

// Admin product routes (require authentication)
router.get('/', getProducts);
router.get('/stats', getProductStats);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Image upload route
router.post('/upload-images', upload.array('images', 10), uploadProductImages);

export default router; 