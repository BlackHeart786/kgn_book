"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck, User } from "lucide-react";

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const [liveUser, setLiveUser] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/freshProfile")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) setError(data.error);
          else setLiveUser(data);
        })
        .catch((e) => setError("Failed to load profile"));
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="text-center py-10 text-gray-300">
        Loading your profile...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  const user = liveUser || session?.user;

  if (!user) {
    return (
      <div className="text-center py-10 text-red-500">
        You are not logged in.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-[#181A1E] text-white rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center mb-8 space-x-4">
        <div className="bg-lime-500 text-[#2a452d] rounded-full h-16 w-16 flex items-center justify-center text-3xl font-bold shadow-md">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-emerald-300">
            Welcome, {user.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
        <div>
          <span className="text-gray-400">User ID:</span>
          <p className="text-white font-semibold">#{user.id}</p>
        </div>
        <div>
          <span className="text-gray-400">Username:</span>
          <p className="text-white font-semibold">{user.username}</p>
        </div>
        <div>
          <span className="text-gray-400">Name:</span>
          <p className="text-white font-semibold">{user.name}</p>
        </div>
        <div>
          <span className="text-gray-400">Email:</span>
          <p className="text-white font-semibold">{user.email}</p>
        </div>
        <div>
          <span className="text-gray-400">CEO Status:</span>
          <p
            className={`inline-flex items-center space-x-1 font-semibold ${
              user.is_ceo ? "text-green-400" : "text-red-400"
            }`}
          >
            {user.is_ceo ? <ShieldCheck size={18} /> : <BadgeCheck size={18} />}
            <span>{user.is_ceo ? "Yes (CEO)" : "No"}</span>
          </p>
        </div>
        <div>
          <span className="text-gray-400">Account Status:</span>
          <span
            className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
              user.is_active
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {user.permissions?.length > 0 && (
        <div className="mt-6">
          <span className="text-gray-400">Permissions:</span>
          <ul className="list-disc list-inside mt-2 text-sm text-lime-300 space-y-1">
            {user.permissions.map((perm: string, index: number) => (
              <li key={index}>{perm}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
