"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession,  } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddVendorModal from "../components/AddVendor";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  gst_no?: string | null;
  vendor_type?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  is_active?: boolean | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  payables?: number | string | null;
}

interface AddVendorFormData {
  vendorDisplayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  vendorEmail: string;
  phone_no?: string;
  gst_no?: string;
  vendor_type?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  is_active?: boolean;
  created_by?: number;
  payables?: number;
}

const VendorsPage = () => {
  const { status } = useSession();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const fetchVendors = useCallback(async (name?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = name ? `/api/vendors?name=${encodeURIComponent(name)}` : "/api/vendors";
      const response = await fetch(url);

      if (response.status === 403) {
        router.push("/unauthorized");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const normalized = (Array.isArray(data) ? data : [data]).map((vendor: Vendor) => ({
        ...vendor,
        payables: vendor.payables != null ? Number(vendor.payables) : 0,
      }));

      setVendors(normalized);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

useEffect(() => {
  const fetchFreshPermissions = async () => {
    if (status !== "authenticated") return;

    try {
      const res = await fetch("/api/freshPermissions");
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const permissions = data?.permissions || [];
      const isCEO = data?.is_ceo;

      const canViewPerm = permissions.includes("vendor_view") || isCEO;
      const canEditPerm = permissions.includes("vendor_edit") || isCEO;

      if (!canViewPerm) {
        router.push("/unauthorized");
        return;
      }

      setCanView(canViewPerm);
      setCanEdit(canEditPerm);
      setSessionLoaded(true);
      fetchVendors();
    } catch (e) {
      console.error("Error fetching fresh permissions:", e);
      setError("Failed to load permissions.");
    }
  };

  fetchFreshPermissions();
}, [status, fetchVendors, router]);

  const handleNewVendorClick = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveNewVendor = async (newVendorData: AddVendorFormData) => {
    if (!canEdit) {
      setError("You do not have permission to add vendors.");
      return;
    }

    try {
      const payload = {
        vendor_name:
          newVendorData.vendorDisplayName ||
          `${newVendorData.firstName || ""} ${newVendorData.lastName || ""}`.trim() ||
          "Unnamed Vendor",
        gst_no: newVendorData.gst_no || null,
        vendor_type: newVendorData.vendor_type || null,
        email: newVendorData.vendorEmail,
        phone: newVendorData.phone_no || null,
        address: newVendorData.address || null,
        bank_name: newVendorData.bank_name || null,
        bank_account_number: newVendorData.bank_account_number || null,
        ifsc_code: newVendorData.ifsc_code || null,
        is_active: newVendorData.is_active ?? true,
        created_by: newVendorData.created_by || null,
        payables: newVendorData.payables || 0,
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        router.push("/unauthorized");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create vendor: ${response.status}`);
      }

      await response.json();
      fetchVendors();
      setIsModalOpen(false);
    } catch (e: any) {
      setError(`Failed to save vendor: ${e.message}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors(searchTerm.trim());
  };

  if (status === "loading" || !sessionLoaded) {
    return <div className="text-center py-8 text-white">Loading session...</div>;
  }

  if (loading) {
    return <div className="text-center py-8 text-white">Loading vendors...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#1F2023] text-white">
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <div className="flex items-center space-x-4">
            {canEdit && (
              <button
                onClick={handleNewVendorClick}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                + New
              </button>
            )}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none"
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
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm font-light">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-6 text-center">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr
                    key={vendor.vendor_id}
                    className="border-b border-gray-700 hover:bg-[#2D2E30]"
                  >
                    <td className="py-3 px-6 text-left">{vendor.vendor_name}</td>
                    <td className="py-3 px-6 text-left">{vendor.vendor_type || "N/A"}</td>
                    <td className="py-3 px-6 text-left">{vendor.email}</td>
                    <td className="py-3 px-6 text-left">{vendor.phone || "N/A"}</td>
                    <td className="py-3 px-6 text-left">
                      ₹{Number(vendor.payables ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {canEdit && (
                        <>
                          <button className="text-blue-500 hover:text-blue-700 mx-1">Edit</button>
                          <button className="text-red-500 hover:text-red-700 mx-1">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && canEdit && (
        <AddVendorModal onClose={handleCloseModal} onSave={handleSaveNewVendor} />
      )}
    </div>
  );
};

export default VendorsPage;
