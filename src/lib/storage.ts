import { supabase, MEDIA_BUCKET } from './supabase'

export async function uploadVideo(
  userId: string,
  postId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'mp4'
  const path = `videos/${userId}/${postId}/video.${ext}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error

  onProgress?.(100)
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadThumbnail(
  userId: string,
  postId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `thumbnails/${userId}/${postId}/thumb.${ext}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteMedia(userId: string, postId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(`videos/${userId}/${postId}`)
  if (files?.length) {
    await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(files.map(f => `videos/${userId}/${postId}/${f.name}`))
  }
  const { data: thumbs } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(`thumbnails/${userId}/${postId}`)
  if (thumbs?.length) {
    await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(thumbs.map(f => `thumbnails/${userId}/${postId}/${f.name}`))
  }
}
