import { userRepository } from '../../repositories/userRepository'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  if (user.role !== 'DOCTOR') throw createError({ statusCode: 403, statusMessage: 'Acceso denegado' })

  const [doctors, firstDoctor] = await Promise.all([
    userRepository.findAllDoctors(),
    userRepository.findFirstDoctor(),
  ])

  const isOwner = firstDoctor?.id === user.sub

  return { success: true, data: { doctors, isOwner } }
})
