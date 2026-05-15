import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const now = new Date().toISOString()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)

  if (error) {
    console.error('run-scheduled error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  const results = []

  for (const post of posts ?? []) {
    const edgeFnUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/publish_post`
    const response = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ post_id: post.id }),
    })
    const data = await response.json()
    results.push({ post_id: post.id, ...data })
  }

  return res.status(200).json({ triggered: results.length, results })
}
