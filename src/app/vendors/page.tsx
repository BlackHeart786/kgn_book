// pages/vendors/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddVendorModal from "../components/AddVendor";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  vendor_type?: string | null;
  email: string;
  phone?: string | null;
  payables?: number | null;
}

const VendorsPage = () => {
  const { status } = useSession();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const fetchVendors = useCallback(async (name?: string) => {
    setLoading(true);
    const url = name ? `/api/vendors?name=${encodeURIComponent(name)}` : "/api/vendors";
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();
    setVendors(Array.isArray(data) ? data : [data]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (status !== "authenticated") return;
      const res = await fetch("/api/freshPermissions");
      const data = await res.json();
      setCanEdit(data.is_ceo || data.permissions?.includes("vendor_edit"));
      setSessionLoaded(true);
      fetchVendors();
    };
    fetchPermissions();
  }, [status, fetchVendors]);

  const handleRowClick = (vendorId: number) => router.push(`/vendors/${vendorId}`);

  return (
    <div className="flex min-h-screen bg-[#1F2023] text-white">
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <div className="flex items-center space-x-4">
            {canEdit && (
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                + New
              </button>
            )}
            <form onSubmit={(e) => { e.preventDefault(); fetchVendors(searchTerm.trim()); }} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 rounded-md bg-[#2D2E30] border border-gray-600"
              />
              <button type="submit" className="text-gray-400 hover:text-white">
                <HiOutlineMagnifyingGlass size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto bg-[#1C1C1D] rounded-lg shadow-md p-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#2D2E30] text-gray-300 uppercase text-sm">
                <th className="py-3 px-6 text-left">Vendor Name</th>
                <th className="py-3 px-6 text-left">Type</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Phone</th>
                <th className="py-3 px-6 text-left">Payables</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm font-light">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-6 text-center">No vendors found.</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.vendor_id} onClick={() => handleRowClick(vendor.vendor_id)} className="cursor-pointer border-b border-gray-700 hover:bg-[#2D2E30]">
                    <td className="py-3 px-6">{vendor.vendor_name}</td>
                    <td className="py-3 px-6">{vendor.vendor_type || "N/A"}</td>
                    <td className="py-3 px-6">{vendor.email}</td>
                    <td className="py-3 px-6">{vendor.phone || "N/A"}</td>
                    <td className="py-3 px-6">₹{Number(vendor.payables ?? 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <AddVendorModal onClose={() => setIsModalOpen(false)} onSave={() => { fetchVendors(); setIsModalOpen(false); }} />}
    </div>
  );
};

export default VendorsPage;
