import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zsttrbeodccfyzimchfb.supabase.co";
const supabaseKey = "sb_publishable_rGr13gNjpP3X_9meL8jFTA_ByNOCIv8";

export const supabase = createClient(supabaseUrl, supabaseKey);