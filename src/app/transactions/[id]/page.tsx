"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Transaction {
  transaction_id: number;
  reference_number: string;
  transaction_date: string;
  type: string;
  transaction_method: string;
  amount: number | null;
  category: string;
  description: string;
  project_id: number | null;
  vendor_id: number | null;
  vendorName: string;
  creatorName: string;
  created_at: string;
  updated_at: string;
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [form, setForm] = useState<Partial<Transaction>>({});
  const [formBackup, setFormBackup] = useState<Partial<Transaction> | null>(null);
  const [canEditDelete, setCanEditDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchTransactionAndPermissions = async () => {
      try {
        const [transactionRes, permissionRes] = await Promise.all([
          fetch(`/api/transactions/${id}`),
          fetch("/api/freshPermissions"),
        ]);

        const transactionData = await transactionRes.json();
        setTransaction(transactionData);
        setForm(transactionData);

        const permissionData = await permissionRes.json();
        const permissions = permissionData?.permissions || [];
        const isCEO = permissionData?.is_ceo;

        setCanEditDelete(isCEO || permissions.includes("financial_edit"));
      } catch (error) {
        console.error("Failed to fetch transaction or permissions", error);
      }
    };

    fetchTransactionAndPermissions();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    await fetch(`/api/transactions/${transaction?.transaction_id}`, { method: "DELETE" });
    router.push("/transactions");
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/transactions/${transaction?.transaction_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      alert("Transaction updated successfully.");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  if (!transaction)
    return <p className="text-white text-center pt-20 text-lg">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#1F2023] text-white px-6 py-16 flex flex-col items-center gap-10">
      <h1 className="text-4xl font-bold text-center border-b border-gray-700 pb-4 w-full max-w-3xl">
        Transaction Details
      </h1>

      <div className="bg-[#2D2E30] w-full max-w-3xl p-8 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
        <DetailRow label="Transaction ID" value={transaction.transaction_id} />
        <EditableRow label="Reference Number" field="reference_number" value={form.reference_number} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Transaction Date" field="transaction_date" value={form.transaction_date} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Type" field="type" value={form.type} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Method" field="transaction_method" value={form.transaction_method} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Amount" field="amount" value={form.amount?.toString() || ""} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Category" field="category" value={form.category} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Description" field="description" value={form.description} setForm={setForm} isEditing={isEditing} />
        <EditableRow label="Project ID" field="project_id" value={form.project_id?.toString() || ""} setForm={setForm} isEditing={isEditing} />
        <DetailRow label="Vendor" value={transaction.vendorName || "N/A"} />
        <DetailRow label="Created By" value={transaction.creatorName || "N/A"} />
        <DetailRow label="Created At" value={transaction.created_at.slice(0, 10)} />
        <DetailRow label="Updated At" value={transaction.updated_at.slice(0, 10)} />
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
                  setForm(formBackup as Partial<Transaction>);
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
  value: string | number | undefined;
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
              [field]: field === "amount" || field === "project_id"
                ? Number(e.target.value) || null
                : e.target.value,
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
