export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
export const unauthorised = (m = 'Please log in to continue.') => new ServiceError(401, m)
export const forbidden = (m = 'You do not have permission to access this.') => new ServiceError(403, m)
export const notFound = (m = 'Not found.') => new ServiceError(404, m)
export const invalid = (m: string) => new ServiceError(400, m)
