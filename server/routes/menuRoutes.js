import express from "express";
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  getTopSelling,
} from "../controllers/menuController.js";
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, admin, createMenu);
router.get("/", getMenus);
router.get("/top-selling", getTopSelling); // Public – no auth required
router.get("/:id", getMenuById);
router.put("/:id", protect, admin, updateMenu);
router.delete("/:id", protect, admin, deleteMenu);

export default router;

