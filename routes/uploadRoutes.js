import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Add CORS headers for upload routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Checking file:', file.originalname, file.mimetype);
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  console.error('❌ Multer error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(400).json({ error: error.message });
};

// Single image upload route
router.post('/', upload.single('image'), handleUploadError, (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('📁 Files:', req.files);
    console.log('📄 File:', req.file);
    console.log('📋 Headers:', req.headers);
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ 
        error: 'No image file provided' 
      });
    }

    console.log('✅ File received:', req.file.originalname);
    console.log('📁 Saved as:', req.file.filename);

    // Return the image URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const prefixRaw = process.env.API_BASE_PATH || '';
    const prefix = prefixRaw ? (prefixRaw.startsWith('/') ? prefixRaw : `/${prefixRaw}`) : '';
    const imageUrl = `${baseUrl}${prefix}/uploads/${req.file.filename}`;
    
    console.log('🖼️ Image URL:', imageUrl);
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image' 
    });
  }
});

// Multiple images upload route
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No image files provided' 
      });
    }

    // Return array of image URLs
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    res.json({
      message: 'Images uploaded successfully',
      imageUrls: imageUrls
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images' 
    });
  }
});

export default router; 