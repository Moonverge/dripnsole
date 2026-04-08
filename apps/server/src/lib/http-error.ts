export class HttpError extends Error {
  readonly statusCode: number
  readonly code?: string
  readonly headers?: Record<string, string>

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    headers?: Record<string, string>,
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.headers = headers
  }
}
