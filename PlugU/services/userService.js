// services/userService.js
import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
  try {
    const { data, error } = await supabase
      .rpc("get_user_with_farm_count", { user_uuid: userId }); 

    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (err) {
    console.error("Error getting user:", err);
    return { success: false, error: err.message };
  }
};


export const saveUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (err) {
    console.error("saveUserProfile error:", err.message);
    return { success: false, error: err.message };
  }
};




