"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

type Props = {
  requiredPermission: string;
};

export default function Unauthorized({ requiredPermission }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasPermission = session?.user?.permissions?.includes(requiredPermission);

  useEffect(() => {
    if (status === "loading") return;

    if (!hasPermission) {
      return;
    }
  }, [status, hasPermission]);

  if (status === "loading") return null;

  if (hasPermission) return null; 

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-700 mb-6">
          🚫 You are not authorized to access this page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
