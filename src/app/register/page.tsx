"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdPersonAdd } from "react-icons/md";
import { ImSpinner2 } from "react-icons/im";
import Link from "next/link";

const RegisterPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormSubmitting(true);

    if (!fullName || !username || !email || !password) {
      setError("Please fill in all fields.");
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // Optional: auto-login after successful registration
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      router.push("/"); 
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F2023] to-black p-4">
        <div className="text-white text-xl flex items-center space-x-3">
          <ImSpinner2 className="animate-spin" />
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F2023] to-black p-4">
      <div className="bg-[#2D2E30] text-white p-8 rounded-lg w-full max-w-md shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField label="Full Name" icon={<FaUser />} value={fullName} onChange={setFullName} placeholder="your example name" />
          <InputField label="Username" icon={<FaUser />} value={username} onChange={setUsername} placeholder="example123" />
          <InputField label="Email" icon={<FaEnvelope />} value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <PasswordField value={password} onChange={setPassword} showPassword={showPassword} toggle={togglePasswordVisibility} />

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={formSubmitting}
            className={`w-full py-2 px-4 flex items-center justify-center rounded-md text-lg font-semibold transition transform hover:scale-[1.02] ${
              formSubmitting ? "bg-lime-800 cursor-not-allowed" : "bg-lime-600 hover:bg-lime-700"
            }`}
          >
            {formSubmitting ? (
              <>
                <ImSpinner2 className="animate-spin mr-2" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <MdPersonAdd className="mr-2" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-blue-400 hover:underline hover:text-blue-300">Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

const InputField = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <div>
    <label className="text-sm text-gray-300 block mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1C1C1D] border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        required
      />
    </div>
  </div>
);

const PasswordField = ({
  value,
  onChange,
  showPassword,
  toggle,
}: {
  value: string;
  onChange: (val: string) => void;
  showPassword: boolean;
  toggle: () => void;
}) => (
  <div>
    <label className="text-sm text-gray-300 block mb-1">Password</label>
    <div className="relative">
      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1C1C1D] border border-gray-600 rounded-md py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="••••••••"
        required
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>
);
