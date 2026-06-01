import express from "express";
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
} from "../controllers/menuController.js";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, createMenu);
router.get("/", getMenus);
router.get("/:id", getMenuById);
router.put("/:id", protect, updateMenu);
router.delete("/:id", protect, deleteMenu);

export default router;
