import { logger } from './logger';

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export function handleError(error: unknown, context?: string): AppError {
  const prefix = context ? `[${context}] ` : '';

  if (error instanceof Error) {
    logger.error(`${prefix}${error.message}`, { stack: error.stack });
    return { message: error.message, details: error.stack };
  }

  if (typeof error === 'string') {
    logger.error(`${prefix}${error}`);
    return { message: error };
  }

  const message = 'Erro inesperado. Tente novamente.';
  logger.error(`${prefix}${message}`, error);
  return { message, details: error };
}

export function getErrorMessage(error: unknown): string {
  return handleError(error).message;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('fetch') || error.message.includes('network') || error.message.includes('NetworkError');
  }
  return false;
}
