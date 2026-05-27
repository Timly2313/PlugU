import { supabase } from '../lib/supabase';
import { uploadMediaToSupabase } from '../services/imageService';

export const createPostService = {

  uploadMedia: async (mediaItems, userId, onProgress) => {
    const urls = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      onProgress?.(`Uploading ${item.type} ${i + 1} of ${mediaItems.length}…`);
      const url = await uploadMediaToSupabase(item.localUri, userId, 'post-media', item.type);
      urls.push(url);
    }
    return urls;
  },

  createPost: async ({ userId, content, mediaUrls, tags }) => {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id:    userId,
        content,
        media_urls: mediaUrls,
        status:     'active',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (tags.length > 0) {
      const tagRows = tags.map((tag) => ({ post_id: post.id, tag_name: tag }));
      await supabase.from('post_tags').insert(tagRows).then(({ error: tagError }) => {
        if (tagError) console.warn('[createPost] tag insert warning:', tagError.message);
      });
    }

    return post;
  },
};