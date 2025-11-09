import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import {
  getBlogs,
  getActiveBlogs,
  getBlogById,
  getPublicBlogByUrl,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus
} from "../controllers/blogController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get('/public/active', getActiveBlogs);
router.get('/public/by-url/:slug', getPublicBlogByUrl);

// Admin routes (require authentication)
router.get('/', authenticateToken, requireRole(["admin", "manager"]), getBlogs);
router.get('/:id', authenticateToken, requireRole(["admin", "manager"]), getBlogById);
router.post('/', authenticateToken, requireRole(["admin", "manager"]), createBlog);
router.put('/:id', authenticateToken, requireRole(["admin", "manager"]), updateBlog);
router.delete('/:id', authenticateToken, requireRole(["admin", "manager"]), deleteBlog);
router.put('/:id/toggle', authenticateToken, requireRole(["admin", "manager"]), toggleBlogStatus);

export default router;

