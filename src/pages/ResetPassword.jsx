import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      console.log("SESSION:", data);
      console.log("SESSION ERROR:", error);

      if (!data.session) {
        alert("Invalid or expired reset link");
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully");
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-md w-[400px]">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-xl mb-4"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-xl mb-5"
        />

        <button
          onClick={handleResetPassword}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;