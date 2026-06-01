import express from "express";
import {
  createTable,
  getTables,
  updateTable,
  deleteTable,
  mergeTables,
  coshareMergeTables,
  coshareUnmergeTables
} from "../controllers/tableController.js";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, createTable);
router.get("/", getTables); 
router.post("/merge", protect, mergeTables); 
router.post("/coshare-merge", protect, coshareMergeTables);
router.post("/coshare-unmerge", protect, coshareUnmergeTables);
router.put("/:id", protect, updateTable);
router.delete("/:id", protect, deleteTable);

export default router;
