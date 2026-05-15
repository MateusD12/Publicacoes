export type Platform = 'youtube' | 'instagram' | 'tiktok'

export interface SocialAccount {
  id: string
  user_id: string
  platform: Platform
  account_id: string
  username: string
  profile_picture_url: string | null
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
export type ResultStatus = 'pending' | 'publishing' | 'published' | 'failed'

export interface Post {
  id: string
  user_id: string
  title: string
  description: string
  video_url: string | null
  thumbnail_url: string | null
  platforms: Platform[]
  scheduled_for: string | null
  status: PostStatus
  created_at: string
  updated_at: string
}

export interface PostResult {
  id: string
  post_id: string
  platform: Platform
  social_account_id: string | null
  status: ResultStatus
  platform_post_id: string | null
  error_message: string | null
  published_at: string | null
}

export interface PostWithResults extends Post {
  post_results: PostResult[]
}

export interface AnalyticsCache {
  id: string
  social_account_id: string
  post_id: string | null
  metric_date: string
  views: number
  likes: number
  comments: number
  shares: number
  raw_data: Record<string, unknown>
}
