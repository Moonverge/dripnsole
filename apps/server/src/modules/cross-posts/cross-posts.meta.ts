import type { ServerEnv } from '@dripnsole/config'
import {
  exchangeCodeForShortLivedUserToken,
  exchangeForLongLivedUserToken,
  hasMetaCredentials,
  listManagedPages,
  metaOAuthAuthorizeUrl,
  pickPageForCrossPost,
  signMetaOAuthState,
  verifyMetaOAuthState,
} from '../../lib/meta-graph.js'
import { encryptSecret } from '../../lib/social-encrypt.js'
import type { CrossPostsRepository } from './cross-posts.repository.js'

interface MetaContext {
  repo: CrossPostsRepository
  env: ServerEnv
}

export async function getMetaOAuthUrl(input: MetaContext & { userId: string }) {
  const rows = await input.repo.findStoreByUserId(input.userId)
  const store = rows[0]
  if (!store) return { kind: 'no_store' as const }
  if (!hasMetaCredentials(input.env)) {
    return { kind: 'not_configured' as const }
  }
  const state = signMetaOAuthState(input.env, { userId: input.userId, storeId: store.id })
  const url = metaOAuthAuthorizeUrl(input.env, state)
  if (!url) return { kind: 'not_configured' as const }
  return { kind: 'ok' as const, url }
}

export async function getMetaConnection(input: MetaContext & { userId: string }) {
  const rows = await input.repo.findStoreByUserId(input.userId)
  const store = rows[0]
  if (!store) return { kind: 'no_store' as const }
  const connected = Boolean(store.metaPageTokenEncrypted && store.metaPageId)
  return {
    kind: 'ok' as const,
    data: {
      connected,
      pageName: store.metaPageName ?? null,
      hasFacebook: connected,
      hasInstagram: Boolean(store.metaIgUserId),
      connectedAt: store.metaConnectedAt ? store.metaConnectedAt.toISOString() : null,
    },
  }
}

export async function completeMetaOAuth(input: MetaContext & { code: string; state: string }) {
  const parsed = verifyMetaOAuthState(input.env, input.state, 15 * 60 * 1000)
  if (!parsed) return { kind: 'bad_state' as const }
  const storeRows = await input.repo.findStoreById(parsed.storeId)
  const store = storeRows[0]
  if (!store || store.userId !== parsed.userId) return { kind: 'forbidden' as const }
  const short = await exchangeCodeForShortLivedUserToken(input.env, input.code)
  const longLived = await exchangeForLongLivedUserToken(input.env, short)
  const pages = await listManagedPages(input.env, longLived.accessToken)
  const page = pickPageForCrossPost(pages)
  if (!page) return { kind: 'no_pages' as const }
  const igId = page.instagram_business_account?.id ?? null
  const enc = encryptSecret(input.env, page.access_token)
  const expiresAt =
    longLived.expiresInSec != null
      ? new Date(Date.now() + longLived.expiresInSec * 1000)
      : null
  await input.repo.setMetaConnection({
    storeId: store.id,
    pageId: page.id,
    pageName: page.name ?? null,
    igUserId: igId,
    pageTokenEncrypted: enc,
    expiresAt,
    connectedAt: new Date(),
  })
  return { kind: 'ok' as const }
}

export async function clearMetaConnection(input: MetaContext & { userId: string }) {
  const rows = await input.repo.findStoreByUserId(input.userId)
  const store = rows[0]
  if (!store) return { kind: 'no_store' as const }
  await input.repo.clearMetaConnection(store.id)
  return { kind: 'ok' as const }
}
