export class RequestSecurityError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = 'request_error') {
    super(message)
    this.name = 'RequestSecurityError'
    this.status = status
    this.code = code
  }
}

export function isRequestSecurityError(error: unknown): error is RequestSecurityError {
  return error instanceof RequestSecurityError
}
