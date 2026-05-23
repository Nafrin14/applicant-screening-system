import React, {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

const Login = () => {

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const handleLogin = () => {

    if (
      email &&
      password
    ) {

      localStorage.setItem(
        "isLoggedIn",
        true
      );

      navigate("/dashboard");

    } else {

      alert(
        "Enter email & password"
      );
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-2xl shadow-md w-[400px]">

        <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full border border-gray-300 p-3 rounded-xl mb-5 outline-none focus:border-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full border border-gray-300 p-3 rounded-xl mb-5 outline-none focus:border-blue-500"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Login
        </button>

      </div>

    </div>
  );
};

export default Login;