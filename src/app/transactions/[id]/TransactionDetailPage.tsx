"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Transaction {
  transaction_id: number;
  reference_number: string;
  transaction_date: string;
  type: string;
  transaction_method: string;
  amount: number;
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

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then((res) => res.json())
      .then(setTransaction);
  }, [id]);

  if (!transaction) return <p className="text-white">Loading...</p>;

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;

    await fetch(`/api/transactions/${transaction.transaction_id}`, {
      method: "DELETE",
    });
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen bg-[#1F2023] text-white px-6 py-10 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold border-b border-gray-700 pb-4">Transaction Details</h1>

      <div className="bg-[#2D2E30] p-8 rounded-xl shadow-md grid grid-cols-2 gap-x-8 gap-y-6">
        <DetailRow label="Transaction ID" value={transaction.transaction_id} />
        <DetailRow label="Reference Number" value={transaction.reference_number || "N/A"} />
        <DetailRow label="Transaction Date" value={transaction.transaction_date || "N/A"} />
        <DetailRow label="Type" value={transaction.type === "income" ? "Income" : "Spend"} />
        <DetailRow label="Method" value={transaction.transaction_method || "N/A"} />
        <DetailRow label="Amount" value={`₹${transaction.amount.toLocaleString("en-IN")}`} />
        <DetailRow label="Category" value={transaction.category || "N/A"} />
        <DetailRow label="Description" value={transaction.description || "N/A"} />
        <DetailRow label="Project ID" value={transaction.project_id || "N/A"} />
        <DetailRow label="Vendor" value={transaction.vendorName || "N/A"} />
        <DetailRow label="Created By" value={transaction.creatorName || "N/A"} />
        <DetailRow label="Created At" value={transaction.created_at || "N/A"} />
        <DetailRow label="Updated At" value={transaction.updated_at || "N/A"} />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push(`/transactions/${transaction.transaction_id}/edit`)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Edit
        </button>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
          Delete
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
