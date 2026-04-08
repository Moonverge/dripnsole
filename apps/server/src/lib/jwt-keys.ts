import { generateKeyPairSync } from 'node:crypto'
import type { ServerEnv } from '@dripnsole/config'
import { importPKCS8, importSPKI, type KeyLike } from 'jose'

let devPrivate: KeyLike | null = null
let devPublic: KeyLike | null = null

export async function getJwtKeys(
  env: ServerEnv,
): Promise<{ privateKey: KeyLike; publicKey: KeyLike }> {
  if (env.JWT_ACCESS_PRIVATE_KEY_PEM && env.JWT_ACCESS_PUBLIC_KEY_PEM) {
    const privateKey = await importPKCS8(env.JWT_ACCESS_PRIVATE_KEY_PEM, 'RS256')
    const publicKey = await importSPKI(env.JWT_ACCESS_PUBLIC_KEY_PEM, 'RS256')
    return { privateKey, publicKey }
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('JWT access keys are required in production')
  }
  if (!devPrivate || !devPublic) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const spki = publicKey.export({ type: 'spki', format: 'pem' }).toString()
    devPrivate = await importPKCS8(pkcs8, 'RS256')
    devPublic = await importSPKI(spki, 'RS256')
  }
  return { privateKey: devPrivate, publicKey: devPublic }
}
