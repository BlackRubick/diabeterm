import { verifyJwt } from '../utils/jwt'

export default defineEventHandler(async (event) => {
  const token =
    getCookie(event, 'auth_token') ||
    getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (token) {
    const payload = await verifyJwt(token)
    if (payload) {
      event.context.user = payload
    }
  }
})
