import express from "express";
import {
  createTable,
  getTables,
  updateTable,
  deleteTable,
  mergeTables
} from "../controllers/tableController.js";

const router = express.Router();

router.post("/", createTable);
router.get("/", getTables); // Gets tables with populated active orders
router.post("/merge", mergeTables); // Special endpoint for merging tables
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

export default router;
