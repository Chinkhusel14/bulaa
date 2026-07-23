import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
    readonly code: string = "bad_request",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  error: FastifyError | AppError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message },
    });
  }

  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    error: {
      code: statusCode >= 500 ? "internal_error" : "request_error",
      message: statusCode >= 500 ? "Internal server error" : error.message,
    },
  });
}
