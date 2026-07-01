import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";

export default function SalesProfile() {
    const [profile, setProfile] = useState({
  name: "",
  email: "",
  phone: "",
  profile_image: "",
  last_login: "",
  created_at: "",
  role: "",
});

const [password, setPassword] = useState("");
useEffect(() => {
  loadProfile();
  loadStats();
}, []);
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
  const { data, error } = await supabase
   .from("csv_uploads")
    .select("*");

  if (error) {
    console.log(error.message);
    return;
  }

  const totalUploads = data.length;

  const successUploads = data.filter(
    (item) => item.status === "success"
  ).length;

  const successRate =
    totalUploads > 0
      ? Math.round((successUploads / totalUploads) * 100)
      : 0;

  setStats({
    totalUploads,
    totalReports: successUploads,
    successRate,
  });
};
const formatJoinedDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLastLogin = (date) => {
  if (!date) return "First Login";

  const loginDate = new Date(date);
  const today = new Date();

  const isToday =
    loginDate.toDateString() === today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    loginDate.toDateString() === yesterday.toDateString();

  const time = loginDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;

  return loginDate.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
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
    alert(error.message);
    return;
  }

  alert("Profile updated successfully.");
};
const uploadProfileImage = async (file) => {
  if (!file) return;

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
    alert(uploadError.message);
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
    alert(error.message);
    return;
  }

  setProfile({
    ...profile,
    profile_image: imageUrl,
  });

  alert("Profile image updated successfully.");
};
  return (
    <div className="min-h-screen bg-[#021b16] text-white">
      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Profile"
          subtitle="Manage your account information and preferences."
        />

        <div className="px-6 py-8 md:px-10">

          {/* Profile Overview */}
         <section className="grid lg:grid-cols-3 gap-6 mb-6">

  {/* Left Card */}
  <div className="dashboard-card lg:col-span-2">

    <div className="flex flex-col md:flex-row items-center gap-8">

      {/* Avatar */}
      <div className="relative">

       <div className="w-36 h-36 rounded-full bg-emerald-500 overflow-hidden flex items-center justify-center text-6xl font-black">
  {profile.profile_image ? (
    <img
      src={profile.profile_image}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    profile.name?.charAt(0).toUpperCase() || "U"
  )}
</div>

        <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          📷
        </button>

      </div>

      {/* Details */}

      <div className="flex-1">

        <div className="flex items-center gap-3">

         <h2 className="text-3xl font-black">
  {profile.name || "User"}
</h2>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
           {profile.role || "User"}
          </span>

        </div>

        <p className="text-white/60 mt-3">
         📧 {profile.email}
        </p>

        <p className="text-white/60 mt-2">
         📞 {profile.phone || "No phone added"}
        </p>

        <div className="flex flex-wrap gap-6 mt-6">

          <p className="text-white/60">
           📅 Joined : {formatJoinedDate(profile.created_at)}
          </p>

          <p className="text-white/60">
           🕒 Last Login : {formatLastLogin(profile.last_login)}
          </p>

        </div>

      </div>

    </div>

  </div>

  {/* Right Card */}

  <div className="dashboard-card">

    <h2 className="text-xl font-bold mb-6">
      Profile Overview
    </h2>

    <div className="space-y-4">

      <div className="flex justify-between">
        <span>Total Uploads</span>
        <span className="font-bold text-emerald-300">
         {stats.totalUploads}
        </span>
      </div>

      <div className="flex justify-between">
        <span>Total Reports</span>
        <span className="font-bold text-emerald-300">
         {stats.totalReports}
        </span>
      </div>

      <div className="flex justify-between">
        <span>Success Rate</span>
        <span className="font-bold text-emerald-300">
         {stats.successRate}%
        </span>
      </div>

      <div className="flex justify-between">
        <span>Member Since</span>
        <span className="font-bold text-emerald-300">
          {formatJoinedDate(profile.created_at)}
        </span>
      </div>

    </div>

  </div>

</section>
<section className="grid lg:grid-cols-3 gap-6 mb-6">

  {/* Edit Profile */}

  <div className="dashboard-card lg:col-span-2">

    <h2 className="text-2xl font-bold mb-8">
      Edit Profile
    </h2>

    <div className="grid md:grid-cols-2 gap-6">

      <div>

        <label className="block mb-2 text-white/70">
          Full Name
        </label>

        <input
          type="text"
         value={profile.name}
onChange={(e) =>
  setProfile({
    ...profile,
    name: e.target.value,
  })
}
          className="w-full bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

      </div>

      <div>

        <label className="block mb-2 text-white/70">
          Email
        </label>

        <input
          type="email"
         value={profile.email}
readOnly
          className="w-full bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

      </div>

      <div>

        <label className="block mb-2 text-white/70">
          Phone
        </label>

        <input
          type="text"
         value={profile.phone}
onChange={(e) =>
  setProfile({
    ...profile,
    phone: e.target.value,
  })
}
          className="w-full bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

      </div>

      <div>

        <label className="block mb-2 text-white/70">
          Password
        </label>

        <input
          type="password"
          placeholder="********"
          className="w-full bg-[#0a2721] border border-white/10 rounded-xl px-4 py-3 outline-none"
        />

      </div>

    </div>

    <div className="mt-8 flex gap-4">

     <button
  onClick={saveProfile}
  className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-xl font-bold"
>
  Save Changes
</button>

      <button className="border border-white/10 px-8 py-3 rounded-xl">
        Cancel
      </button>

    </div>

  </div>

  {/* Profile Image */}

  <div className="dashboard-card">

    <h2 className="text-xl font-bold mb-6">
      Profile Image
    </h2>

    <div className="flex flex-col items-center">

     <div className="w-36 h-36 rounded-full bg-emerald-500 overflow-hidden flex items-center justify-center text-5xl font-black mb-6">
  {profile.profile_image ? (
    <img
      src={profile.profile_image}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    profile.name?.charAt(0).toUpperCase() || "U"
  )}
</div>

     <label className="bg-emerald-500 px-6 py-3 rounded-xl font-bold cursor-pointer">
  Upload Image

  <input
    type="file"
    accept="image/*"
    className="hidden"
   onChange={(e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("Image size must be less than 2MB.");
    return;
  }

  setImageFile(file);
  uploadProfileImage(file);
}}
  />
</label>

      <p className="text-white/50 text-sm mt-4 text-center">
        JPG, PNG up to 2MB
      </p>

    </div>

  </div>

</section>

        </div>
      </main>
    </div>
  );
}