import { SignJWT, jwtVerify } from 'jose'

export interface JwtPayload {
  sub: string
  email: string
  role: 'DOCTOR' | 'PATIENT'
  nombre: string
}

function getSecret(): Uint8Array {
  const config = useRuntimeConfig()
  return new TextEncoder().encode(config.jwtSecret)
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  }
  catch {
    return null
  }
}
