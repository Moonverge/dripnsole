export type CrossPostPlatform = 'facebook' | 'instagram'
export type CrossPostStatus = 'posting' | 'posted' | 'failed' | 'removed'

export interface CrossPost {
  id: string
  listingId: string
  platform: CrossPostPlatform
  status: CrossPostStatus
  caption: string
  remotePostId: string | null
  remoteUrl: string | null
  errorMessage: string | null
  postedAt: string | null
  createdAt: string
}

export interface MetaConnection {
  connected: boolean
  pageName: string | null
  hasFacebook: boolean
  hasInstagram: boolean
  connectedAt: string | null
}

export interface CrossPostOutcome {
  platform: CrossPostPlatform
  status: 'posting' | 'posted' | 'failed'
  crossPostId: string
  remoteUrl?: string | null
  error?: string
}

export interface BulkCrossPostItem {
  listingId: string
  caption: string
}
