"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { MdLogin } from "react-icons/md";
import SuccessScreen from "../SuccessScreen";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setFormSubmitting(false);
    } else {
      setShowSuccess(true); 
      setTimeout(() => {
        router.push("/");
      }, 2500); 
    }
  };

  return (
    <>
      {showSuccess && (
        <SuccessScreen
          title="Login Successful"
          message="You have successfully logged into your account."
          duration={2000}
          onClose={() => setShowSuccess(false)}
          showActionButton={false}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F2023] to-black p-4">
        <div className="bg-[#2D2E30] text-white p-8 rounded-lg w-full max-w-md shadow-2xl border border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">Welcome To KGN Book</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Email</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1C1C1D] border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1C1C1D] border border-gray-600 rounded-md py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={formSubmitting}
              className={`w-full py-2 px-4 flex items-center justify-center bg-lime-400 rounded-md text-lg font-semibold transition transform hover:scale-[1.02] ${
                formSubmitting
                  ? "bg-lime-800 cursor-not-allowed"
                  : "bg-lime-600 hover:bg-lime-700"
              }`}
            >
              {formSubmitting ? (
                <span className="flex items-center space-x-2">
                  <ImSpinner2 className="animate-spin" />
                  <span>Logging In...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <MdLogin />
                  <span>Login</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don’t have an account?{" "}
            <Link href="/register">
              <span className="text-blue-400 hover:underline hover:text-blue-300">
                Create one
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
