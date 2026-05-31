import { supabase } from '../lib/supabase';

export const marketService = {

  getBanners: async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('id, image_url, cta_type, cta_value, title, subtitle')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(3);
    if (error) throw error;
    return data ?? [];
  },
};