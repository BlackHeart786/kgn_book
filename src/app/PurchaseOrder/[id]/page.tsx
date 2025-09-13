"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImSpinner2 } from "react-icons/im";
import { MdDownload, MdArrowBack } from "react-icons/md";
import { useReactToPrint } from "react-to-print";

// ---------------- Types (align with your APIs) ----------------
interface CompanyDetails {
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  gst_no?: string;
}

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  gst_no?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface PurchaseOrderItem {
  product_name?: string;
  description?: string;
  quantity: number; // integer
  rate: number;     // unit rate
  tax_rate: number; // decimal (e.g., 0.18)
  amount: number;   // quantity * rate (pre-tax)
  total_amount: number; // amount + tax
}

interface PurchaseOrder {
  id: number | string;
  po_number: string;
  vendor_id: number;
  order_date: string; // YYYY-MM-DD (or ISO)
  expected_delivery?: string | null; // YYYY-MM-DD
  // billing_address?: string;
  memo?: string | null;
  discount?: number; // absolute number
  shipping_cost?: number;
  currency?: string; // e.g., "INR"
  status?: string;   // e.g., DRAFT/APPROVED
  subtotal?: number; // pre-tax subtotal (optional – can be derived)
  total_amount?: number; // grand total (optional – can be derived)
  purchase_order_items: PurchaseOrderItem[];
}

// ---------------- Page ----------------
export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const poId = params?.id;
  const printRef = useRef<HTMLDivElement>(null);

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Fetchers ----------
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        // 1) PO details
        const poRes = await fetch(`/api/po/${poId}`, { cache: "no-store" });
        if (!poRes.ok) throw new Error(`PO fetch failed: HTTP ${poRes.status}`);
        const poData: PurchaseOrder = await poRes.json();
        if (cancelled) return;
        setPo(poData);

        // 2) Company details
        const coRes = await fetch("/api/company_details", { cache: "no-store" });
        if (!coRes.ok) throw new Error(`Company fetch failed: HTTP ${coRes.status}`);
        const coData: CompanyDetails = await coRes.json();
        if (cancelled) return;
        setCompany(coData);

        // 3) Vendor – prefer /api/vendors/:id if your backend exposes it
        let vend: Vendor | null = null;
        try {
          const vRes = await fetch(`/api/vendors/${poData.vendor_id}`, { cache: "no-store" });
          if (vRes.ok) {
            vend = await vRes.json();
          } else {
            // fallback: fetch list and find
            const listRes = await fetch("/api/vendors", { cache: "no-store" });
            if (listRes.ok) {
              const arr: Vendor[] = await listRes.json();
              vend = arr.find((v) => Number(v.vendor_id) === Number(poData.vendor_id)) || null;
            }
          }
        } catch (_) {
          // ignore and keep vend as null
        }
        if (!cancelled) setVendor(vend);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load purchase order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (poId) fetchAll();
    return () => {
      cancelled = true;
    };
  }, [poId]);

  // ---------- Derived totals (if backend didn't compute) ----------
  const derived = useMemo(() => {
    if (!po) return null;
    const items = po.purchase_order_items || [];
    const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalTax = items.reduce((s, it) => s + (Number(it.total_amount) - Number(it.amount) || 0), 0);
    const discount = Number(po.discount || 0);
    const shipping = Number(po.shipping_cost || 0);
    const grand = (po.total_amount ?? (subtotal - discount + totalTax + shipping));
    return { subtotal, totalTax, discount, shipping, grand };
  }, [po]);

  // ---------- Number helpers ----------
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (v: any) => num(v).toFixed(2);

  // ---------- Print to PDF ----------
  const handleDownloadPdf = useReactToPrint({
    contentRef: printRef,
    documentTitle: po ? `PO_${po.po_number}` : "Purchase_Order",
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .a4-sheet { min-height: calc(297mm - 24mm); overflow: hidden; }
      .a4-sheet table { border-collapse: collapse; width: 100%; }
      .a4-sheet th, .a4-sheet td { border: 1px solid #d1d5db; }
      @media print { html, body { width: 190mm; height: 200mm; } }
    `,
  });

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8 grid place-items-center">
        <div className="flex items-center gap-3 text-gray-200">
          <ImSpinner2 className="animate-spin" /> Loading purchase order…
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600"
        >
          <MdArrowBack /> Back
        </button>
        <div className="mt-6 p-4 rounded-md bg-red-500/20 text-red-300">
          {error || "Purchase order not found."}
        </div>
      </div>
    );
  }

  const orderDate = po.order_date ? new Date(po.order_date) : null;
  const expectedDate = po.expected_delivery ? new Date(po.expected_delivery) : null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Purchase Order Details</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md text-sm"
            >
              <MdArrowBack className="inline -mt-1" /> Back
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 text-sm"
            >
              <MdDownload className="text-lg" /> Download PDF
            </button>
          </div>
        </div>

        <div className="bg-[#2D2E30] p-8 rounded-lg shadow-lg">
          <div
            ref={printRef}
            className="a4-sheet bg-white text-gray-900 p-8 rounded-md shadow-lg"
            style={{ width: "170mm", minHeight: "270mm", margin: "0 auto", fontSize: 12, lineHeight: 1.5 }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold">PURCHASE ORDER</h2>
                <p className="text-gray-700">PO Number: {po.po_number}</p>
                {orderDate && (
                  <p className="text-gray-700">Date: {orderDate.toLocaleDateString()}</p>
                )}
                {expectedDate && (
                  <p className="text-gray-700">Expected Delivery: {expectedDate.toLocaleDateString()}</p>
                )}
                {/* {po.status && (
                  <p className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border">Status: {po.status}</p>
                )} */}
              </div>

              <div className="text-right">
                <h3 className="text-xl font-bold">{company?.company_name || "Your Company"}</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {company?.address || "Company Address"}
                  {company?.city && `, ${company.city}`}
                  {company?.state && `, ${company.state}`}
                  {company?.pin_code && ` - ${company.pin_code}`}
                  {company?.country && `\n${company.country}`}
                  {company?.phone && `\nPhone: ${company.phone}`}
                  {company?.email && `\nEmail: ${company.email}`}
                  {company?.gst_no && `\nGST: ${company.gst_no}`}
                </p>
              </div>
            </div>

            {/* Vendor */}
            <div className="mb-6">
              <h4 className="font-bold mb-1">Vendor:</h4>
              <p className="text-gray-800 whitespace-pre-line">
                {vendor?.vendor_name || `#${po.vendor_id}`}
                {vendor?.address ? `\n${vendor.address}` : ""}
                {vendor?.gst_no ? `\nGST: ${vendor.gst_no}` : ""}
                {vendor?.phone ? `\nPhone: ${vendor.phone}` : ""}
                {vendor?.email ? `\nEmail: ${vendor.email}` : ""}
              </p>
            </div>

            {/* Billing address */}
            {/* {po.billing_address && (
              <div className="mb-6">
                <h4 className="font-bold mb-1">Billing Address:</h4>
                <p className="text-gray-800 whitespace-pre-line">{po.billing_address}</p>
              </div>
            )} */}

            {/* Items table */}
            <table className="min-w-full border border-gray-300 mb-8 mt-10 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Item</th>
                  <th className="border px-3 py-2 text-left">Description</th>
                  <th className="border px-3 py-2 text-right">Qty</th>
                  <th className="border px-3 py-2 text-right">Rate</th>
                  <th className="border px-3 py-2 text-right">Tax %</th>
                  <th className="border px-3 py-2 text-right">Tax Amt</th>
                  <th className="border px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {po.purchase_order_items.map((it, idx) => {
                  const amount = Number(it.amount) || (Number(it.quantity) * Number(it.rate));
                  const taxAmt = (Number(it.total_amount) || (amount + amount * Number(it.tax_rate))) - amount;
                  const total = Number(it.total_amount) || (amount + taxAmt);
                  return (
                    <tr key={idx}>
                      <td className="border px-3 py-2">{it.product_name || "N/A"}</td>
                      <td className="border px-3 py-2">{it.description || ""}</td>
                      <td className="border px-3 py-2 text-right">{it.quantity}</td>
                      <td className="border px-3 py-2 text-right">₹{Number(it.rate).toFixed(2)}</td>
                      <td className="border px-3 py-2 text-right">{(Number(it.tax_rate) * 100).toFixed(2)}%</td>
                      <td className="border px-3 py-2 text-right">₹{taxAmt.toFixed(2)}</td>
                      <td className="border px-3 py-2 text-right font-medium">₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-1/2 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(derived?.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>₹{(derived?.totalTax ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>₹{(derived?.discount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>₹{(derived?.shipping ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-green-600">₹{money(derived?.grand)}</span>
                </div>
              </div>
            </div>

            {/* Memo */}
            {po.memo && (
              <div className="mt-8">
                <h4 className="font-bold mb-1">Memo / Notes</h4>
                <p className="text-gray-800 whitespace-pre-line">{po.memo}</p>
              </div>
            )}

            <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
              Thank you for your business!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
