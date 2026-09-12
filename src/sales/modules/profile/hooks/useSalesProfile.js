import { useEffect, useState } from "react";
import { supabase } from "../../../../core/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────
// Loads the signed-in sales rep's own profile plus their upload/success
// stats, and provides the save-profile and upload-avatar actions.
// ─────────────────────────────────────────────────────────────────────────
export default function useSalesProfile({ notify }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    profile_image: "",
    last_login: "",
    created_at: "",
    role: "",
  });

  const [imageFile, setImageFile] = useState(null);

  const [stats, setStats] = useState({
    totalUploads: 0,
    totalReports: 0,
    successRate: 0,
  });

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log(error.message);
      return;
    }

    setProfile({
      name: data?.name || "",
      email: data?.email || user.email || "",
      phone: data?.phone || "",
      profile_image: data?.profile_image || "",
      last_login: data?.last_login || "",
      created_at: data?.created_at || "",
      role: data?.role || "user",
    });
  };

  const loadStats = async () => {
    const { data, error } = await supabase.from("csv_uploads").select("*");

    if (error) {
      console.log(error.message);
      return;
    }

    const totalUploads = data.length;

    const successUploads = data.filter(
      (item) => item.status === "success"
    ).length;

    const successRate =
      totalUploads > 0 ? Math.round((successUploads / totalUploads) * 100) : 0;

    setStats({
      totalUploads,
      totalReports: successUploads,
      successRate,
    });
  };

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        phone: profile.phone,
      })
      .eq("id", user.id);

    if (error) {
      notify(error.message, { type: "error" });
      return;
    }

    notify("Profile updated successfully.", { type: "success" });
  };

  const uploadProfileImage = async (file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify("Image size must be less than 2MB.", { type: "error" });
      return;
    }

    setImageFile(file);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file);

    if (uploadError) {
      notify(uploadError.message, { type: "error" });
      return;
    }

    const { data } = supabase.storage
      .from("profile-images")
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    const { error } = await supabase
      .from("profiles")
      .update({
        profile_image: imageUrl,
      })
      .eq("id", user.id);

    if (error) {
      notify(error.message, { type: "error" });
      return;
    }

    setProfile((prev) => ({
      ...prev,
      profile_image: imageUrl,
    }));

    notify("Profile image updated successfully.", { type: "success" });
  };

  return {
    profile, setProfile,
    imageFile,
    stats,
    saveProfile,
    uploadProfileImage,
  };
}
