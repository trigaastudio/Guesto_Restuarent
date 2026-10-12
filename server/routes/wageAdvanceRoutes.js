import express from 'express';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getWageAdvances,
  createWageAdvance,
  updateWageAdvance,
  toggleSettlementStatus,
  deleteWageAdvance,
  getWageAdvanceSummary,
} from '../controllers/wageAdvanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected for admin only
router.use(protect, admin);

// Summary statistics
router.get('/summary', getWageAdvanceSummary);

// Employees directory CRUD
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Wage Advances CRUD
router.get('/', getWageAdvances);
router.post('/', createWageAdvance);
router.put('/:id', updateWageAdvance);
router.patch('/:id/toggle-settle', toggleSettlementStatus);
router.delete('/:id', deleteWageAdvance);

export default router;
