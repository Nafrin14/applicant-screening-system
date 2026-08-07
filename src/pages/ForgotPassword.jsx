import React, { useState } from "react";
import { supabase } from "../supabase";
import { useNotification } from "../context/NotificationContext";

function ForgotPassword() {
  const { notify, confirmDialog } = useNotification();
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: window.location.origin + "/reset-password"
    });

    if (error) {
      notify(error.message, { type: "error" });
    } else {
      notify("Password reset email sent", { type: "success" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-md w-[400px]">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Forgot Password
        </h1>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-xl mb-5"
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-3 rounded-xl"
        >
          Send Reset Link
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;