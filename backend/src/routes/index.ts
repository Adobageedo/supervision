import { Router } from 'express';
import authRoutes from './authRoutes';
import interventionRoutes from './interventionRoutes';
import predefinedValueRoutes from './predefinedValueRoutes';
import auditRoutes from './auditRoutes';
import intervenantRoutes from './intervenantRoutes';
import companyRoutes from './companyRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/interventions', interventionRoutes);
router.use('/predefined', predefinedValueRoutes);
router.use('/audit', auditRoutes);
router.use('/intervenants', intervenantRoutes);
router.use('/companies', companyRoutes);

export default router;