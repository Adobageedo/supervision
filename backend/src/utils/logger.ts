import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

// Ajouter un transport fichier en production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_FILE || 'logs/app.log';
  logger.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), logDir),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

export default logger;
