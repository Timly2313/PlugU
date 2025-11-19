import { supabase } from "../lib/supabase";

export const uploadMediaToSupabase = async (fileUri, userId, folder, type = "image") => {
  try {
    if (!fileUri || !fileUri.startsWith("file://")) {
      throw new Error("Invalid file URI");
    }

    console.log(`Uploading ${type} from:`, fileUri);

    // Determine file extension
    const fileExtension =
      fileUri.split(".").pop()?.toLowerCase() || (type === "video" ? "mp4" : "jpg");
    const fileName = `${folder}/${userId}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`;

    console.log("Uploading file as:", fileName);

    // Create FormData
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: `${type}/${fileExtension}`,
    });

    console.log("Uploading to Supabase Storage...");

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(fileName, formData);

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(folder)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData?.publicUrl;
    console.log("Upload successful:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadMediaToSupabase:", error.message);
    throw error;
  }
};
