import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { getErrorMessage } from '../utils/error.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttpException ? exception.getResponse() : undefined;

    let message = getErrorMessage(exception);
    let error = exception instanceof Error ? exception.name : 'InternalServerError';

    if (isHttpException) {
      if (typeof payload === 'string') {
        message = payload;
      } else if (isRecord(payload)) {
        const payloadMessage = payload.message;
        if (typeof payloadMessage === 'string') {
          message = payloadMessage;
        } else if (Array.isArray(payloadMessage) && payloadMessage.every((m) => typeof m === 'string')) {
          message = payloadMessage.join(', ');
        }

        if (typeof payload.error === 'string') {
          error = payload.error;
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      error,
      message,
    });
  }
}
