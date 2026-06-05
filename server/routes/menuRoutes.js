import express from "express";
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
} from "../controllers/menuController.js";
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, admin, createMenu);
router.get("/", getMenus);
router.get("/:id", getMenuById);
router.put("/:id", protect, admin, updateMenu);
router.delete("/:id", protect, admin, deleteMenu);

export default router;
