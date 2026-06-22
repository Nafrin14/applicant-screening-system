import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../supabaseClient";

import {
  FaShieldAlt,
  FaUserCircle,
  FaSave,
} from "react-icons/fa";

function Settings() {
  const [companyName, setCompanyName] = useState("SmartHire");
  const [hrRole, setHrRole] = useState("HR Manager");
const [email, setEmail] = useState("");
const [newEmail, setNewEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [profileImage, setProfileImage] = useState("");
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

   if (data) {
  setCompanyName(data.company_name);
  setHrRole(data.hr_name);
  setEmail(data.email);
  setProfileImage(data.profile_image || "");
}

    console.log("FETCH DATA:", data);
    console.log("FETCH ERROR:", error);
  };

  const handleSave = async () => {
    alert("Button Clicked");

    console.log("Saving...", companyName, hrRole);

    const { data, error } = await supabase
      .from("settings")
     .update({
  company_name: companyName,
  hr_name: hrRole,
  profile_image: profileImage,
})
      .eq("id", 1)
      .select();

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert("Update Failed");
      console.log(error);
    } else {
      alert("Settings Updated Successfully");
      fetchSettings();
    }
  };
  const handlePasswordUpdate = async () => {
  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (newPassword.length < 8) {
    alert("Password must be at least 8 characters");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Password Updated Successfully");
    setNewPassword("");
    setConfirmPassword("");
  }
};

const handleEmailUpdate = async () => {
  if (!newEmail) {
    alert("Please enter a new email");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    alert(error.message);
  } else {
    alert(
      "Verification email sent. Please check your new email inbox."
    );
    setNewEmail("");
  }
};


const handleImageUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const fileName = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-images")
    .upload(fileName, file);

  if (uploadError) {
    alert(uploadError.message);
    return;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("profile-images")
    .getPublicUrl(fileName);

  setProfileImage(publicUrl);

  const { error: updateError } = await supabase
    .from("settings")
    .update({
      profile_image: publicUrl,
    })
    .eq("id", 1);

  if (updateError) {
    console.log(updateError);
    alert(updateError.message);
  } else {
    alert("Profile image updated successfully");
  }
};
 return (

  <div className="min-h-screen bg-slate-100 flex flex-col">

    

    <div className="flex">

      {/* Sidebar */}

   <Sidebar />

      {/* Main */}

  <div className="flex-1 md:ml-56  p-4 md:p-6 min-h-screen overflow-y-auto">
        {/* Header */}

       <div className="mb-6 pt-14 md:pt-0">

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">
            Settings
          </h1>

          <p className="text-gray-500 text-sm">
            Manage your account and system settings
          </p>

        </div>

        {/* Top Grid */}

    <div className="grid grid-cols-1 xl:grid-cols-[3fr_1.2fr] gap-5 mb-5">
          {/* Profile */}

         <div  className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">

         <div className="flex flex-col items-center text-center sm:text-left sm:items-start gap-4 mb-6">
 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
    {profileImage ? (
      <img
        src={profileImage}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    ) : (
      <FaUserCircle className="text-5xl text-blue-600" />
    )}
  </div>

  <div className="w-full">

    <h2 className="text-2xl font-black text-slate-800">
      Profile Settings
    </h2>

    <p className="text-gray-500 text-sm mt-1">
      Update company and HR details
    </p>

   <input
  type="file"
  accept="image/*"
  onChange={handleImageUpload}
  className="text-sm mt-4 mx-auto sm:mx-0"
/>

  </div>

</div>
            <div className="space-y-4">

             <input
  type="text"
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
/>


<input
  type="email"
  value={email}
  readOnly
  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 outline-none cursor-not-allowed"
/>

<input
  type="email"
  placeholder="Enter New Email"
  value={newEmail}
  onChange={(e) => setNewEmail(e.target.value)}
  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
/>

<button
  onClick={handleEmailUpdate}
  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold transition-all"
>
  Update Email
</button>

             <input
  type="text"
  value={hrRole}
  onChange={(e) => setHrRole(e.target.value)}
  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
/>

            </div>

          </div>

          {/* Security */}

       <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">

                <FaShieldAlt className="text-red-500 text-xl" />

              </div>

              <div>

                <h2 className="text-xl font-black text-slate-800">
                  Security
                </h2>

                <p className="text-gray-500 text-sm">
                  Password protection
                </p>

              </div>

            </div>

            <div className="space-y-4">

              <input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
/>

              <input
  type="password"
  placeholder="Confirm Password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
/>


              <p className="text-xs text-slate-500">
  Password must contain at least 8 characters.
</p>

              <button
  onClick={handlePasswordUpdate}
  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold transition-all"
>
  Update Password
</button>

            </div>

          </div>

        </div>
           
        {/* Bottom Buttons */}

 <div className="flex justify-center md:justify-end mt-4">

        <button
  onClick={handleSave}
  className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
  px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition-all"
>
  <FaSave />
  Save Changes
</button>
            
        </div>

      </div>
</div>
    </div>
  );
}

export default Settings;