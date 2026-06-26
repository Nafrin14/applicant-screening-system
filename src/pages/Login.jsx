import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import bgImage from "../assets/new_premium_bg.png";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaBriefcase,
  FaShieldAlt,
  FaTree,
  FaChartLine,
  FaBullseye,
} from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("smarthire");
  const [salesRole, setSalesRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

 const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    // 1. Authenticate user against Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    try {
      // 2. Fetch profile metrics to confirm role mappings and active status bounds
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        throw new Error("Could not find user profile configuration rules.");
      }

      // 3. Prevent login if the administrator has marked this user account as disabled/deactivated
      if (profile.is_active === false) {
        alert("Your account has been deactivated by the system administrator.");
        await supabase.auth.signOut();
        return;
      }

      // 4. SMART HIRE RULE: Only let admin user access SmartHire
      if (activeTab === "smarthire") {
        if (profile.role !== "admin") {
          alert("Access Denied: Only administrators can access the SmartHire Platform.");
          await supabase.auth.signOut();
          return;
        }
        localStorage.setItem("isLoggedIn", "true");
        navigate("/dashboard");
        return;
      }

      // SALES TEAM LOGIN

localStorage.setItem("isLoggedIn", "true");

if (activeTab === "sales") {

  // Admin button select pannitu user account login panna
  if (salesRole === "admin" && profile.role !== "admin") {
    alert("This account is not an Admin account.");
    await supabase.auth.signOut();
    return;
  }

  // User button select pannitu admin account login panna
  if (salesRole === "user" && profile.role !== "user") {
    alert("This account is not a User account.");
    await supabase.auth.signOut();
    return;
  }

  if (profile.role === "admin") {
    navigate("/sales-admin-dashboard");
  } else {
    navigate("/sales-dashboard");
  }
}

    } catch (err) {
      alert(err.message || "An authentication verification error occurred.");
      await supabase.auth.signOut();
    }
 }
  return (
    <div
      className="h-screen relative overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(1,25,15,0.45), rgba(0,10,6,0.82)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-emerald-950/45"></div>

      {/* Slanted black panel */}
      <div className="hidden lg:block absolute top-0 left-[23%] h-full w-[390px] bg-emerald-950/90 -skew-x-[14deg] shadow-[0_0_80px_rgba(0,0,0,0.8)]"></div>

      {/* Left dark gradient */}
      <div className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-black/80 to-transparent hidden lg:block"></div>

      {/* Right dark gradient */}
      <div className="absolute inset-y-0 right-0 w-[35%] bg-gradient-to-l from-black/70 to-transparent hidden lg:block"></div>

      {/* Main content */}
     <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        
                {/* Login card wrapper */}
        <div className="w-full flex items-center justify-center">
          
          {/* Part 2 login card starts here */}
          <div className="w-full max-w-[420px] rounded-[30px]
bg-emerald-950/70
backdrop-blur-3xl
border border-emerald-400/30
shadow-[0_0_45px_rgba(16,185,129,0.22)]
ring-1 ring-white/10
overflow-hidden">

  {/* Logo */}

  <div className="flex justify-center pt-8">

    <div
      className="
      w-20
      h-20
      rounded-2xl
      border-2
      border-emerald-400
      bg-black/60
      flex
      flex-col
      items-center
      justify-center
      shadow-lg
      shadow-emerald-500/30">

      <h1 className="text-emerald-300 text-4xl font-black">
        KD
      </h1>

      <p className="text-white text-xs tracking-[3px] font-bold">
        MARKETING
      </p>

    </div>

  </div>

  <div className="px-7 pb-7">

    <h2 className="text-center text-3xl font-black mt-5">
      Welcome Back
    </h2>

    <p className="text-center text-white/60 mt-2 mb-7">
      Sign in to access your account
    </p>

    {/* SmartHire / Sales */}

    <div className="grid grid-cols-2 gap-3">

      <button
        onClick={() =>
          setActiveTab("smarthire")
        }

        className={`h-12 rounded-xl text-sm font-bold transition

        ${
          activeTab==="smarthire"

          ?

          "bg-emerald-500 text-white"

          :

          "bg-white/5 text-white border border-white/10"

        }`}>

        SmartHire

      </button>

      <button
        onClick={() =>
          setActiveTab("sales")
        }

        className={`h-12 rounded-xl text-sm font-bold transition

        ${
          activeTab==="sales"

          ?

           "bg-emerald-500 text-white"


          :

          "bg-white/5 text-white border border-white/10"

        }`}>

        Sales Team

      </button>

    </div>
        {activeTab === "sales" && (
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          onClick={() => setSalesRole("user")}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            salesRole === "user"
              ? "bg-white text-black"
              : "bg-white/5 text-white/70 border border-white/10"
          }`}
        >
          User Login
        </button>

        <button
          type="button"
          onClick={() => setSalesRole("admin")}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            salesRole === "admin"
              ? "bg-white text-black"
              : "bg-white/5 text-white/70 border border-white/10"
          }`}
        >
          Admin Login
        </button>
      </div>
    )}

    {/* Part 3 form starts here */}
        <div className="mt-6">
      <label className="block text-sm font-semibold mb-2">
        Email Address
      </label>

      <div className="relative">
        <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 rounded-xl bg-white/5 border border-white/10 pl-14 pr-4 text-white placeholder-white/35 outline-none focus:border-emerald-400"
        />
      </div>
    </div>

    <div className="mt-5">
      <label className="block text-sm font-semibold mb-2">
        Password
      </label>

      <div className="relative">
        <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          className="w-full h-12 rounded-xl bg-white/5 border border-white/10 pl-14 pr-14 text-white placeholder-white/35 outline-none focus:border-yellow-500"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-emerald-300"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>

    <div className="flex items-center justify-between mt-5">
      <label className="flex items-center gap-2 text-white/70 text-sm">
        <input
          type="checkbox"
          className="w-4 h-4 accent-emerald-500"
        />
        Remember me
      </label>

      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="text-yellow-400 text-sm font-bold hover:underline"
      >
        Forgot password?
      </button>
    </div>

    <button
      type="button"
      onClick={handleLogin}
      className="w-full h-12 mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition"
    >
      ♠ Sign In
    </button>

    <div className="flex items-center gap-5 my-6">
      <div className="flex-1 h-px bg-white/15"></div>
      <span className="text-white/50">or</span>
      <div className="flex-1 h-px bg-white/15"></div>
    </div>

    <p className="text-center text-white/65 text-sm">
      Don&apos;t have an account?{" "}
      <button
        type="button"
        onClick={() => navigate("/signup")}
        className="text-yellow-400 font-bold hover:underline"
      >
        Contact Admin
      </button>
    </p>

  </div>
</div>
</div>


      </div>
    </div>
  );
} 