import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, admin, createCategory);
router.get("/", getCategories);
router.put("/:id", protect, admin, updateCategory);
router.delete("/:id", protect, admin, deleteCategory);

export default router;
