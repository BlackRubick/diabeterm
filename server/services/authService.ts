import { userRepository } from '../repositories/userRepository'
import { verifyPassword } from '../utils/password'
import { signJwt } from '../utils/jwt'

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })

    const valid = await verifyPassword(password, user.password)
    if (!valid) throw createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
      },
    }
  },
}
