
import { supabase } from "../lib/supabase";

export const fetchListings = async ({
  mode = "feed",
  userId = null,
  search = "",
  status = "active",
  category = null,
  location = null,
  limit = 20,
  offset = 0,
}) => {
  let query = supabase
    .from("listings")
    .select(`
      id,
      title,
      description,
      price,
      location,
      category,
      status,
      media_url,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `);

  if (mode === "feed") {
    query = query.eq("status", status);
  }

  if (mode === "myListings") {
    query = query.eq("user_id", userId);
  }

  if (mode === "userListings") {
    query = query.eq("user_id", userId).eq("status", "approved");
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  if (category) query = query.eq("category", category);
  if (location) query = query.eq("location", location);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const fetchListingById = async (listingId) => {
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      description,
      price,
      location,
      category,
      status,
      media_url,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url,
        banner_url
      )
    `)
    .eq("id", listingId)
    .single();

  if (error) throw error;

  return mapListing(data);
};

const mapListing = (row) => {
  const images = row.media_url ?? [];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    location: row.location,
    category: row.category,
    images,
    postedDate: new Date(row.created_at).toDateString(),
    seller: {
      id: row.profiles?.id,
      name: row.profiles?.full_name ?? "Unknown",
      avatar: row.profiles?.avatar_url,
      banner: row.profiles?.banner_url,
    },
  };
};

