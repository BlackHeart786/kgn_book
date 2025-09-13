"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
  created_at: string | null;
  updated_at: string | null;
  payables?: number | null;
}

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [formBackup, setFormBackup] = useState<Partial<Vendor> | null>(null);
  const [canEditDelete, setCanEditDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchVendorAndPermissions = async () => {
      try {
        const [vendorRes, permissionRes] = await Promise.all([
          fetch(`/api/vendors/${id}`),
          fetch("/api/freshPermissions"),
        ]);

        const vendorData = await vendorRes.json();
          console.log(`[frontend] Vendor:`, vendorData);

        setVendor(vendorData);
        setForm(vendorData);

        const permissionData = await permissionRes.json();
        const permissions = permissionData?.permissions || [];
        const isCEO = permissionData?.is_ceo;
        setCanEditDelete(isCEO || permissions.includes("vendor_edit"));
      } catch (error) {
        console.error("Failed to fetch vendor or permissions", error);
      }
    };

    fetchVendorAndPermissions();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    await fetch(`/api/vendors/${vendor?.vendor_id}`, { method: "DELETE" });
    router.push("/vendors");
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/vendors/${vendor?.vendor_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      alert("Vendor updated successfully.");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  if (!vendor)
    return <p className="text-white text-center pt-20 text-lg">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#1F2023] text-white px-6 py-16 flex flex-col items-center gap-10">
      <h1 className="text-4xl font-bold text-center border-b border-gray-700 pb-4 w-full max-w-3xl">
        Vendor Details
      </h1>

      <div className="bg-[#2D2E30] w-full max-w-3xl p-8 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
        <DetailRow label="Vendor ID" value={vendor.vendor_id} />
        <EditableRow label="Vendor Name" field="vendor_name" value={form.vendor_name} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="GST No." field="gst_no" value={form.gst_no} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Type" field="vendor_type" value={form.vendor_type} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Email" field="email" value={form.email} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Phone" field="phone" value={form.phone} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Address" field="address" value={form.address} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Bank Name" field="bank_name" value={form.bank_name} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Account No." field="bank_account_number" value={form.bank_account_number} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="IFSC" field="ifsc_code" value={form.ifsc_code} setForm={setForm} isEditing={isEditing} />
        <DetailRow label="Payables" value={`₹${Number(vendor.payables || 0).toFixed(2)}`} />
        <DetailRow label="Created At" value={vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : "N/A"} />
        <DetailRow label="Updated At" value={vendor.updated_at ? new Date(vendor.updated_at).toLocaleDateString() : "N/A"} />
      </div>

      {canEditDelete && (
        <div className="flex gap-6 mt-6">
          {!isEditing ? (
            <button
              onClick={() => {
                setFormBackup(form);
                setIsEditing(true);
              }}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setForm(formBackup as Partial<Vendor>);
                  setIsEditing(false);
                }}
                className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function EditableRow({
  label,
  field,
  value,
  setForm,
  isEditing,
}: {
  label: string;
  field: string;
  value: string | number | undefined | null;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 hover:bg-[#3A3B3C] p-2 rounded-md transition-colors">
      <span className="text-gray-400 text-xs">{label}</span>
      {isEditing ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              [field]: e.target.value,
            }))
          }
          className="bg-[#3a3d40] hover:bg-[#505357] px-2 py-1 rounded-md border border-gray-600 focus:outline-none text-white transition-all duration-300"
        />
      ) : (
        <span className="text-white font-medium text-sm break-all">{value || "N/A"}</span>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-md">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-white font-medium text-sm break-all">{value}</span>
    </div>
  );
}
