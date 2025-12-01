import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import logger from './utils/logger';
import routes from './routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4202;

// Middleware de sécurité
app.use(helmet());

// CORS
app.use(
  cors({
    origin: ['https://chardouin.fr', 'http://localhost:4200','http://localhost'], // multiple allowed domains
    credentials: true,
  })
);

// Compression des réponses
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger les requêtes
app.use(requestLogger);
app.set('trust proxy', 1);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes API
app.use('/api', routes);

// Gestion des erreurs
app.use(errorHandler);

// Initialiser la base de données et démarrer le serveur
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Data Source has been initialized!');
    
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ Error during Data Source initialization:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  });

// Gestion des erreurs non gérées
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
