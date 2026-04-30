import { createHmac, timingSafeEqual } from 'node:crypto'
import type { ServerEnv } from '@dripnsole/config'

const GRAPH = 'https://graph.facebook.com'
const OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
].join(',')

type MetaEnv = ServerEnv & {
  META_APP_ID?: string
  META_APP_SECRET?: string
  META_REDIRECT_URI: string
  META_GRAPH_VERSION: string
}

function metaEnv(env: ServerEnv): MetaEnv {
  return env as MetaEnv
}

function graphVersion(env: ServerEnv): string {
  return metaEnv(env).META_GRAPH_VERSION
}

export function hasMetaCredentials(env: ServerEnv): boolean {
  const meta = metaEnv(env)
  return Boolean(meta.META_APP_ID && meta.META_APP_SECRET)
}

export function metaOAuthAuthorizeUrl(env: ServerEnv, state: string): string | null {
  const meta = metaEnv(env)
  const appId = meta.META_APP_ID
  if (!appId) return null
  const redirect = encodeURIComponent(meta.META_REDIRECT_URI)
  const version = graphVersion(env)
  const base = `https://www.facebook.com/${version}/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${redirect}&state=${encodeURIComponent(state)}&response_type=code`
  const configId = env.FACEBOOK_LOGIN_CONFIG_ID?.trim()
  if (configId) {
    return `${base}&config_id=${encodeURIComponent(configId)}`
  }
  return `${base}&scope=${encodeURIComponent(OAUTH_SCOPES)}`
}

export function signMetaOAuthState(
  env: ServerEnv,
  input: { userId: string; storeId: string },
): string {
  const secret =
    env.JWT_REFRESH_SECRET ?? metaEnv(env).META_APP_SECRET ?? 'dev-only-meta-oauth-state'
  const payload = JSON.stringify({
    u: input.userId,
    s: input.storeId,
    t: Date.now(),
  })
  const b64 = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', secret).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export function verifyMetaOAuthState(
  env: ServerEnv,
  state: string,
  maxAgeMs: number,
): { userId: string; storeId: string } | null {
  const secret =
    env.JWT_REFRESH_SECRET ?? metaEnv(env).META_APP_SECRET ?? 'dev-only-meta-oauth-state'
  const dot = state.lastIndexOf('.')
  if (dot <= 0) return null
  const b64 = state.slice(0, dot)
  const sig = state.slice(dot + 1)
  const expect = createHmac('sha256', secret).update(b64).digest('base64url')
  try {
    if (
      sig.length !== expect.length ||
      !timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expect, 'utf8'))
    ) {
      return null
    }
  } catch {
    return null
  }
  try {
    const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as {
      u: string
      s: string
      t: number
    }
    if (typeof data.u !== 'string' || typeof data.s !== 'string') return null
    if (Date.now() - data.t > maxAgeMs) return null
    return { userId: data.u, storeId: data.s }
  } catch {
    return null
  }
}

async function graphGet<T>(
  env: ServerEnv,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const u = new URL(`${GRAPH}/${graphVersion(env)}${path}`)
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v)
  }
  const res = await fetch(u.toString())
  const json = (await res.json()) as T & { error?: { message: string } }
  if (!res.ok || (json as { error?: unknown }).error) {
    const msg =
      (json as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

async function graphPostForm<T>(
  env: ServerEnv,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const body = new URLSearchParams(params)
  const res = await fetch(`${GRAPH}/${graphVersion(env)}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = (await res.json()) as T & { error?: { message: string } }
  if (!res.ok || (json as { error?: unknown }).error) {
    const msg =
      (json as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json
}

export async function exchangeCodeForShortLivedUserToken(
  env: ServerEnv,
  code: string,
): Promise<string> {
  const meta = metaEnv(env)
  const appId = meta.META_APP_ID
  const secret = meta.META_APP_SECRET
  if (!appId || !secret) throw new Error('META_APP_ID and META_APP_SECRET must be set')
  const data = await graphGet<{ access_token: string }>(env, '/oauth/access_token', {
    client_id: appId,
    redirect_uri: meta.META_REDIRECT_URI,
    client_secret: secret,
    code,
  })
  return data.access_token
}

export async function exchangeForLongLivedUserToken(
  env: ServerEnv,
  shortLivedUserToken: string,
): Promise<{ accessToken: string; expiresInSec?: number }> {
  const meta = metaEnv(env)
  const appId = meta.META_APP_ID
  const secret = meta.META_APP_SECRET
  if (!appId || !secret) throw new Error('META_APP_ID and META_APP_SECRET must be set')
  const data = await graphGet<{ access_token: string; expires_in?: number }>(
    env,
    '/oauth/access_token',
    {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: secret,
      fb_exchange_token: shortLivedUserToken,
    },
  )
  return { accessToken: data.access_token, expiresInSec: data.expires_in }
}

export type PageWithIg = {
  id: string
  name: string
  access_token: string
  instagram_business_account?: { id: string }
}

export async function listManagedPages(
  env: ServerEnv,
  userAccessToken: string,
): Promise<PageWithIg[]> {
  const data = await graphGet<{ data: PageWithIg[] }>(env, '/me/accounts', {
    fields: 'name,access_token,instagram_business_account{id}',
    access_token: userAccessToken,
    limit: '100',
  })
  return data.data ?? []
}

export function pickPageForCrossPost(pages: PageWithIg[]): PageWithIg | null {
  const withIg = pages.find((p) => p.instagram_business_account?.id)
  return withIg ?? pages[0] ?? null
}

export async function publishFacebookPagePhoto(input: {
  env: ServerEnv
  pageId: string
  pageAccessToken: string
  imageUrl: string
  message: string
}): Promise<{ postId: string; permalink: string }> {
  const data = await graphPostForm<{ id: string; post_id?: string }>(
    input.env,
    `/${input.pageId}/photos`,
    {
      url: input.imageUrl,
      published: 'true',
      message: input.message,
      access_token: input.pageAccessToken,
    },
  )
  const postId = data.post_id ?? data.id
  const permalink = `https://www.facebook.com/${postId}`
  return { postId, permalink }
}

export async function publishInstagramFeedPhoto(input: {
  env: ServerEnv
  igUserId: string
  pageAccessToken: string
  imageUrl: string
  caption: string
}): Promise<{ mediaId: string; permalink: string }> {
  const container = await graphPostForm<{ id: string }>(input.env, `/${input.igUserId}/media`, {
    image_url: input.imageUrl,
    caption: input.caption,
    access_token: input.pageAccessToken,
  })
  const published = await graphPostForm<{ id: string }>(
    input.env,
    `/${input.igUserId}/media_publish`,
    {
      creation_id: container.id,
      access_token: input.pageAccessToken,
    },
  )
  const info = await graphGet<{ permalink?: string }>(input.env, `/${published.id}`, {
    fields: 'permalink',
    access_token: input.pageAccessToken,
  })
  return {
    mediaId: published.id,
    permalink: info.permalink ?? `https://www.instagram.com/p/${published.id}/`,
  }
}

export async function postFacebookComment(input: {
  env: ServerEnv
  objectId: string
  pageAccessToken: string
  message: string
}): Promise<void> {
  await graphPostForm(input.env, `/${input.objectId}/comments`, {
    message: input.message,
    access_token: input.pageAccessToken,
  })
}
