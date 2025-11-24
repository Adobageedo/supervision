import { Router } from 'express';
import authRoutes from './authRoutes';
import interventionRoutes from './interventionRoutes';
import predefinedValueRoutes from './predefinedValueRoutes';
import auditRoutes from './auditRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/interventions', interventionRoutes);
router.use('/predefined', predefinedValueRoutes);
router.use('/audit', auditRoutes);

export default router;
