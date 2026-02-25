import { supabase } from "../lib/supabase";
import { uploadMediaToSupabase } from "../services/imageService";
import {formatTimestamp} from "../utilities/timestamps"
/* ---------------- Helpers ---------------- */



const mapPost = post => {
  const media = post.media_url ?? [];

  const images = media.filter(url =>
    /\.(jpg|jpeg|png|webp)$/i.test(url)
  );

  const videos = media.filter(url =>
    /\.(mp4|mov|webm)$/i.test(url)
  );

  return {
    id: post.id,
    author: {
      id:post.profiles?.id,
      name: post.profiles?.full_name ?? "Unknown",
      avatar: post.profiles?.avatar_url ?? null,
    },
    content: post.content,
    images,
    videos,
    image: images[0] ?? null,
    tags: post.post_tags?.map(t => t.tags.name) ?? [],
    likes: 0,
    comments: 0,
    shares: 0,
    timestamp: formatTimestamp(post.created_at),
    isLiked: false,
  };
};

/* ---------------- Create Post ---------------- */

export const createPost = async ({
  userId,
  content,
  media = [],
  tags = [],
}) => {
  const mediaUrls = [];

  for (const item of media) {
    const publicUrl = await uploadMediaToSupabase(
      item.uri,
      userId,
      "post-media",
      item.type
    );
    mediaUrls.push(publicUrl);
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content,
      media_url: mediaUrls.length ? mediaUrls : null,
    })
    .select()
    .single();

  if (error) throw error;

  for (const tag of tags) {
    const { data: tagRow, error: tagError } = await supabase
      .from("tags")
      .upsert(
        { name: tag.toLowerCase() },
        { onConflict: "name" }
      )
      .select()
      .single();

    if (tagError) throw tagError;

    const { error: linkError } = await supabase
      .from("post_tags")
      .insert({
        post_id: post.id,
        tag_id: tagRow.id,
      });

    if (linkError) throw linkError;
  }

  return post;
};

/* ---------------- Fetch Posts ---------------- */

export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      media_url,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url
      ),
      post_tags (
        tags (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(mapPost);
};

/* ---------------- Realtime ---------------- */

export const subscribeToPosts = ({ onInsert, onDelete }) => {
  const channel = supabase
    .channel("posts-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      async payload => {
        // 🔥 re-fetch full post so images + profile work
        const { data } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            media_url,
            created_at,
            profiles (
              id,
              full_name,
              avatar_url
            ),
            post_tags (
              tags (
                name
              )
            )
          `)
          .eq("id", payload.new.id)
          .single();

        if (data) onInsert?.(mapPost(data));
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "posts" },
      payload => onDelete?.(payload.old.id)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

export const toggleLike = async (postId, userId) => {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);
  } else {
    await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
  }
};

export const fetchComments = async postId => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const addComment = async (postId, content, userId) => {
  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    });

  if (error) throw error;
};
