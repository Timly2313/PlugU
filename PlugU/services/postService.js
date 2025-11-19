import { supabase } from "../lib/supabase";
import { uploadMediaToSupabase } from "./imageService"; 

export const upsertPost = async (post) => {
  try {
    const uploadedUrls = [];

    if (post.files && post.files.length > 0) {
      for (const file of post.files) {
        if (file?.uri) {
          const isImage = file?.type?.includes("image");
          const folder = isImage ? "postImages" : "postVideos";

          const uploadedUrl = await uploadMediaToSupabase(
            file.uri,
            post.user_id,
            folder,
            isImage ? "image" : "video"
          );

          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
          } else {
            throw new Error("Failed to upload media file");
          }
        }
      }
    }

    const payload = {
      post_id: post.post_id ?? undefined, 
      user_id: post.user_id,
      content: post.content || "",
      post_type: post.post_type || "general",
      images: uploadedUrls.length > 0 ? uploadedUrls : post.images || [],
      tags: post.tags || [],
      type: post.type || "general",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("posts")
      .upsert(payload, { onConflict: "post_id" })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      return { success: false, msg: "Failed to save post" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("upsertPost error:", error);
    return { success: false, msg: error.message || "Unexpected error occurred" };
  }
};


export const fetchPosts = async (limit=10)=>{
  try{
    const {data, error} = await supabase
      .from('posts')
      .select(`
        *,
        user: users (id, full_name, profile_image, location, is_verified)
      `)
      .order('created_at', {ascending: false})
      .limit(limit);

    if(error){
      console.log('fetchPosts error: ', error);
      return {success: false, msg: 'Could not fetch the posts'};
    }

    return {success: true, data: data};
  }catch(error){
    console.log('fetchPosts error: ', error);
    return {success: false, msg: 'Could not fetch the posts'};
  }
}