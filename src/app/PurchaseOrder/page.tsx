/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit,
  FiEye,
} from "react-icons/fi";

// --- API types (adjust if your API differs) ---
type APIStatus = "DRAFT" | "SENT" | "RECEIVED" | "BILLED" | "CANCELLED";

interface PurchaseOrderAPI {
  id: string;
  po_number: string;
  vendor_id: number;         // <-- important: using vendor_id now
  vendor_name?: string;      // optional fallback if backend returns it
  order_date: string;        // ISO or "YYYY-MM-DD"
  total_amount: number;
  status: APIStatus;
}

interface VendorById {
  vendor_id: number;
  vendor_name?: string;      // or `name` depending on your API
  name?: string;
}

type UIStatus = "all" | "Draft" | "Sent" | "Received" | "Billed" | "Cancelled";

const toUIStatus = (s: APIStatus): Exclude<UIStatus, "all"> => {
  switch (s) {
    case "DRAFT": return "Draft";
    case "SENT": return "Sent";
    case "RECEIVED": return "Received";
    case "BILLED": return "Billed";
    case "CANCELLED": return "Cancelled";
    default: return "Draft";
  }
};

export default function PurchaseOrderPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<UIStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<PurchaseOrderAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // cache for vendor names: vendor_id -> vendor_name
  const [vendorNameById, setVendorNameById] = useState<Map<number, string>>(new Map());
  const [vendorLoading, setVendorLoading] = useState(false);

  // Fetch POs
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/po");
        if (!res.ok) throw new Error("Failed to fetch purchase orders");
        const data: PurchaseOrderAPI[] = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching POs:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // After we have orders, batch-fetch missing vendors via /api/vendors/:id and cache them
  useEffect(() => {
    if (!orders.length) return;

    const missingIds = Array.from(
      new Set(
        orders
          .map(o => Number(o.vendor_id))
          .filter((id) => Number.isFinite(id))
          .filter((id) => !vendorNameById.has(id))
      )
    );

    if (missingIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        setVendorLoading(true);
        const results = await Promise.all(
          missingIds.map(async (id) => {
            const res = await fetch(`/api/vendors/${id}`);
            if (!res.ok) throw new Error(`Vendor ${id} fetch failed`);
            const v: VendorById = await res.json();
            const name = v.vendor_name ?? v.name ?? `#${id}`;
            return [id, name] as const;
          })
        );
        if (cancelled) return;

        setVendorNameById((prev) => {
          const next = new Map(prev);
          for (const [id, name] of results) next.set(id, name);
          return next;
        });
      } catch (e) {
        console.error("Failed to fetch one or more vendors:", e);
      } finally {
        if (!cancelled) setVendorLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orders, vendorNameById]);

  // combine vendor name resolution into the list we render/filter
  const ordersWithVendorName = useMemo(() => {
    return orders.map((po) => {
      const resolvedName =
        vendorNameById.get(Number(po.vendor_id)) ??
        po.vendor_name ??
        `#${po.vendor_id}`;
      return { ...po, _vendor_name_resolved: resolvedName };
    });
  }, [orders, vendorNameById]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ordersWithVendorName.filter((po) => {
      const matchesSearch =
        !q ||
        po.po_number?.toLowerCase().includes(q) ||
        po._vendor_name_resolved?.toLowerCase().includes(q);
      const statusUI = toUIStatus(po.status);
      const matchesTab = activeTab === "all" || statusUI === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [ordersWithVendorName, searchQuery, activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      const res = await fetch(`/api/po/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete purchase order");
      setOrders((prev) => prev.filter((po) => po.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete purchase order.");
    }
  };

  const statusPillClasses = (status: UIStatus) => {
    switch (status) {
      case "Draft": return "bg-gray-900 text-gray-300";
      case "Sent": return "bg-blue-900 text-blue-300";
      case "Received": return "bg-green-900 text-green-300";
      case "Billed": return "bg-purple-900 text-purple-300";
      case "Cancelled": return "bg-red-900 text-red-300";
      default: return "bg-gray-800 text-gray-300";
    }
  };

  const anyLoading = loading || vendorLoading;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Purchase Orders</h1>
        <button
          onClick={() => router.push("/PurchaseOrder/create")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus /> New PO
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO # or Vendor..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {(["all", "Draft", "Sent", "Received", "Billed", "Cancelled"] as UIStatus[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {tab === "all" ? "All" : tab}
                </button>
              )
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {anyLoading ? (
            <p className="text-gray-400">Loading purchase orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-gray-400">No purchase orders found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 px-6 text-gray-400 font-medium">PO #</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Vendor</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Order Date</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Amount</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Status</th>
                  <th className="pb-3 px-6 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => {
                  const uiStatus = toUIStatus(po.status);
                  return (
                    <tr
                      key={po.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => router.push(`/PurchaseOrder/${po.id}`)}
                    >
                      <td className="py-4 px-6 text-white font-medium">
                        {po.po_number}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {po._vendor_name_resolved}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {po.order_date
                          ? new Date(po.order_date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-white">
                        ₹{Number(po.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusPillClasses(
                            uiStatus
                          )}`}
                        >
                          {uiStatus}
                        </span>
                      </td>
                      <td
                        className="py-4 px-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/PurchaseOrder/${po.id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300"
                            title="View PO"
                          >
                            <FiEye />
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/PurchaseOrder/${po.id}/edit`)
                            }
                            className="p-2 text-yellow-400 hover:text-yellow-300"
                            title="Edit PO"
                          >
                            <FiEdit />
                          </button>

                          <button
                            className="p-2 text-red-400 hover:text-red-300"
                            title="Delete PO"
                            onClick={() => handleDelete(po.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
