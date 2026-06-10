import { z } from 'zod'
import { authService } from '../../services/authService'

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const { token, user } = await authService.login(body.email, body.password)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  return { success: true, data: { user } }
})
