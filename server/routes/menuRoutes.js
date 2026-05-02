import express from 'express';
import { getMenus, getMenuById } from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenus);
router.get('/:id', getMenuById);

export default router;
