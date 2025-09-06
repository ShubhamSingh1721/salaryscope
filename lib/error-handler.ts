export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  FILE_PROCESSING_ERROR = "FILE_PROCESSING_ERROR",
  PARSING_ERROR = "PARSING_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  SECURITY_ERROR = "SECURITY_ERROR",
}

export interface AppError {
  type: ErrorType
  message: string
  details?: string
  code?: string
  statusCode?: number
  retryable?: boolean
  userMessage?: string
}

export class ErrorHandler {
  public static createError(
    type: ErrorType,
    message: string,
    details?: string,
    statusCode = 500,
    retryable = false,
  ): AppError {
    return {
      type,
      message,
      details,
      statusCode,
      retryable,
      userMessage: this.getUserFriendlyMessage(type, message),
    }
  }

  public static handleFileProcessingError(error: unknown): AppError {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("PDF")) {
        return this.createError(ErrorType.FILE_PROCESSING_ERROR, "PDF processing failed", error.message, 400, true)
      }

      if (error.message.includes("DOCX") || error.message.includes("mammoth")) {
        return this.createError(ErrorType.FILE_PROCESSING_ERROR, "DOCX processing failed", error.message, 400, true)
      }

      if (error.message.includes("ENOENT") || error.message.includes("file not found")) {
        return this.createError(
          ErrorType.FILE_PROCESSING_ERROR,
          "File not found or corrupted",
          error.message,
          400,
          false,
        )
      }

      if (error.message.includes("EMFILE") || error.message.includes("too many open files")) {
        return this.createError(ErrorType.SERVER_ERROR, "Server temporarily overloaded", error.message, 503, true)
      }
    }

    return this.createError(
      ErrorType.FILE_PROCESSING_ERROR,
      "Unknown file processing error",
      error instanceof Error ? error.message : String(error),
      500,
      true,
    )
  }

  public static handleParsingError(error: unknown): AppError {
    if (error instanceof Error) {
      if (error.message.includes("insufficient text")) {
        return this.createError(
          ErrorType.PARSING_ERROR,
          "Document contains insufficient text for analysis",
          error.message,
          400,
          false,
        )
      }

      if (error.message.includes("corrupted") || error.message.includes("invalid")) {
        return this.createError(
          ErrorType.PARSING_ERROR,
          "Document appears to be corrupted or invalid",
          error.message,
          400,
          false,
        )
      }
    }

    return this.createError(
      ErrorType.PARSING_ERROR,
      "Failed to extract salary information",
      error instanceof Error ? error.message : String(error),
      500,
      true,
    )
  }

  public static handleValidationError(errors: string[]): AppError {
    return this.createError(ErrorType.VALIDATION_ERROR, "Validation failed", errors.join("; "), 400, false)
  }

  private static getUserFriendlyMessage(type: ErrorType, message: string): string {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
        return "Please check your file and try again."

      case ErrorType.FILE_PROCESSING_ERROR:
        return "We had trouble processing your file. Please ensure it's not corrupted and try again."

      case ErrorType.PARSING_ERROR:
        return "We couldn't extract salary information from this document. Please ensure it contains clear salary details."

      case ErrorType.NETWORK_ERROR:
        return "Network connection issue. Please check your internet and try again."

      case ErrorType.RATE_LIMIT_ERROR:
        return "Too many requests. Please wait a moment before trying again."

      case ErrorType.SECURITY_ERROR:
        return "File rejected for security reasons. Please use only legitimate offer letter documents."

      default:
        return "Something went wrong. Please try again or contact support if the problem persists."
    }
  }
}

export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>()
  private static readonly MAX_REQUESTS = 10
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes

  public static checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now()
    const userRequests = this.requests.get(identifier)

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or create new entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      })
      return { allowed: true }
    }

    if (userRequests.count >= this.MAX_REQUESTS) {
      return { allowed: false, resetTime: userRequests.resetTime }
    }

    userRequests.count++
    return { allowed: true }
  }
}
