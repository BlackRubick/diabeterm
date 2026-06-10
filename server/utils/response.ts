export function successResponse<T>(data: T, message?: string) {
  return { success: true, data, message }
}

export function errorResponse(message: string, statusCode = 400) {
  throw createError({ statusCode, statusMessage: message })
}
