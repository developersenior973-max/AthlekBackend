import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import {
  getBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getActiveBundles,
  getActiveBundlesByCategory,
  getPublicBundleDetail,
  calculateBundleDiscount
} from "../controllers/bundleController.js";

const router = express.Router();

// Admin bundle routes (require authentication)
router.get('/', authenticateToken, getBundles);
router.get('/:id', authenticateToken, getBundleById);
router.post('/', authenticateToken, requireRole(["admin", "manager"]), createBundle);
router.put('/:id', authenticateToken, requireRole(["admin", "manager"]), updateBundle);
router.delete('/:id', authenticateToken, requireRole(["admin", "manager"]), deleteBundle);

// Public bundle routes (no authentication required)
router.get('/public/active', getActiveBundles);
router.get('/public/active/:category', getActiveBundlesByCategory);
router.get('/public/detail/:id', getPublicBundleDetail);
router.post('/public/calculate-discount', calculateBundleDiscount);

export default router; 