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
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", protect, admin, createTable);
router.get("/", getTables); 
router.post("/merge", protect, admin, mergeTables); 
router.post("/coshare-merge", protect, coshareMergeTables);  
router.post("/coshare-unmerge", protect, coshareUnmergeTables); 
router.put("/:id", protect, admin, updateTable);
router.delete("/:id", protect, admin, deleteTable);

export default router;
