"use client";

import React, { useEffect, useState } from "react";
import { MdCheck, MdClose } from "react-icons/md";

interface Vendor {
  vendor_id: number;
  vendor_name: string;
}

export interface NewTransactionFormData {
  transaction_date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "spend";
  transaction_method: string;
  project_id?: number | null;
  vendor_id?: number | null;
  reference_number?: string | null;
}

interface AddTransactionProps {
  onClose: () => void;
  onSave: (data: NewTransactionFormData) => void;
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<NewTransactionFormData>({
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    amount: 0,
    type: "spend",
    transaction_method: "",
    project_id: null,
    vendor_id: null,
    reference_number: null,
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch("/api/vendors");
        const data = await res.json();
        setVendors(data);
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
      }
    };
    fetchVendors();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? parseFloat(value)
          : name === "project_id" || name === "vendor_id"
          ? value === ""
            ? null
            : parseInt(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.description ||
      !formData.category ||
      !formData.transaction_method ||
      formData.amount <= 0 ||
      !formData.transaction_date
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1C1C1D] rounded-lg shadow-xl w-full max-w-lg overflow-hidden text-white">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Add New Transaction</h2>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700  text-white py-2 px-4 rounded-md flex items-center space-x-2"
              >
                <MdCheck />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center space-x-2"
              >
                <MdClose />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Description */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Reference Number */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reference_number: e.target.value || null,
                  }))
                }
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Category */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Amount */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={isNaN(formData.amount) ? "" : formData.amount}
                onChange={handleChange}
                min="0"
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Type */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              >
                <option value="spend">Spend</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Transaction Method */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Transaction Method
              </label>
              <input
                type="text"
                name="transaction_method"
                value={formData.transaction_method}
                onChange={handleChange}
                placeholder="e.g., UPI, Bank, Cash"
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Project ID */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-400 mb-1">
                Project ID (Optional)
              </label>
              <input
                type="number"
                name="project_id"
                value={formData.project_id ?? ""}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              />
            </div>

            {/* Vendor */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">
                Vendor (Optional)
              </label>
              <select
                name="vendor_id"
                value={formData.vendor_id ?? ""}
                onChange={handleChange}
                className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md"
              >
                <option value="">-- Not Linked to Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.vendor_id} value={v.vendor_id}>
                    {v.vendor_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
