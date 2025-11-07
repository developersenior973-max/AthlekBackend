import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import {
  getCarouselImages,
  getActiveCarouselImages,
  getCarouselImageById,
  createCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
  toggleCarouselImageStatus
} from "../controllers/carouselImageController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get('/public/active', getActiveCarouselImages);

// Admin routes (require authentication)
router.get('/', authenticateToken, requireRole(["admin", "manager"]), getCarouselImages);
router.get('/:id', authenticateToken, requireRole(["admin", "manager"]), getCarouselImageById);
router.post('/', authenticateToken, requireRole(["admin", "manager"]), createCarouselImage);
router.put('/:id', authenticateToken, requireRole(["admin", "manager"]), updateCarouselImage);
router.delete('/:id', authenticateToken, requireRole(["admin", "manager"]), deleteCarouselImage);
router.put('/:id/toggle', authenticateToken, requireRole(["admin", "manager"]), toggleCarouselImageStatus);

export default router;

