/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiPrinter,
  FiDownload,
  FiTrash2,
  FiEdit,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { METHODS } from "http";

export default function InvoicePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/invoice");
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || invoice.status === activeTab;
    return matchesSearch && matchesTab;
  });
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you wanted to delete this invoice? ")) return;
    try {
      const res = await fetch(`/api/invoice/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("failed to delete invoice");
      }
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
    } catch (err) {
      alert("failed to delete invoice.");
    }
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Invoicing</h1>
        <button
          onClick={() => router.push("/invoice/create")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus /> Create Invoice
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-4 py-2 rounded-lg ${
                activeTab === "paid"
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-gray-400">Loading invoices...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-gray-400">No invoices found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Invoice #
                  </th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Client
                  </th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Date</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Due Date
                  </th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => router.push(`/invoice/${invoice.id}`)}
                  >
                    <td className="py-4 px-6 text-white font-medium">
                      {invoice.invoice_number}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {invoice.customer_name}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-4 px-6 text-white">
                      ₹{invoice.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-900 text-green-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td
                      className="py-4 px-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        {/* Action buttons unchanged */}
                        <button
                          onClick={() => router.push(`/invoice/${invoice.id}`)}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="View Invoice"
                        >
                          <FiPrinter />
                        </button>

                        {/* <button
            onClick={() => router.push(`/invoice/${invoice.id}`)}
            className="p-2 text-gray-400 hover:text-gray-300"
            title="Download Invoice"
          >
            <FiDownload />
          </button>

          <button
            onClick={() => router.push(`/invoice/${invoice.id}?edit=true`)}
            className="p-2 text-gray-400 hover:text-gray-300"
            title="Edit Invoice"
          >
            <FiEdit />
          </button> */}

                        <button
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Delete Invoice"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
