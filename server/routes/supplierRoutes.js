import express from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSupplierSummary,
} from '../controllers/supplierController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All supplier routes protected for admin
router.use(protect, admin);

// Summary statistics
router.get('/summary', getSupplierSummary);

// Supplier CRUD
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

// Transactions (expenses & advances) CRUD
router.get('/transactions/all', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;
