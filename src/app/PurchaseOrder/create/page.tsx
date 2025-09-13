"use client";

import React, { useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MdAdd, MdDelete, MdSave, MdCancel, MdDownload } from "react-icons/md";
import { ImSpinner2 } from "react-icons/im";

import { useReactToPrint } from "react-to-print";


// ---------- Types ----------
interface Vendor {
  name: ReactNode;
  id: string | number | readonly string[] | undefined;
  vendor_id: number;
  vendor_name: string;
  gst_no?: string;
  vendor_type?: string;
  email?: string;
  phone?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  is_active?: boolean;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

interface LineItem {
  tempId: number;
  productId: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number; // decimal (0.18 = 18%)
}

interface PurchaseOrderFormState {
  poNumber: string;
  vendorId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  billingAddress: string;
  lineItems: LineItem[];
  memo: string;
  discount: number;
  shippingCost: number;
}

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

// ---------- Helpers ----------
function generatePONumber() {
  const now = new Date();
  const datePart = `${(now.getMonth() + 1).toString().padStart(2, "0")}${now
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  const timePart = `${now.getHours().toString().padStart(2, "0")}${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
  const randomPart = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `PO-${datePart}${timePart}${randomPart}`;
}

// ---------- Mock products ----------
const mockProducts: Product[] = [
  { id: "prod_1", name: "Laptop Pro X", unitPrice: 1200.0 },
  { id: "prod_2", name: "Wireless Mouse", unitPrice: 25.0 },
  { id: "prod_3", name: "Mechanical Keyboard", unitPrice: 80.0 },
  { id: "prod_4", name: "Monitor 27-inch", unitPrice: 300.0 },
  { id: "serv_1", name: "Consulting Service (Hr)", unitPrice: 150.0 },
  { id: "serv_2", name: "Software License (Annual)", unitPrice: 500.0 },
];

const NewPurchaseOrderPage = () => {
  const router = useRouter();
  const poPreviewRef = useRef<HTMLDivElement>(null);

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  // Company details
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PurchaseOrderFormState>({
    poNumber: generatePONumber(),
    vendorId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    billingAddress:
      "our Company Name\nour Company Address, City, State, Zip\nPhone:  90000006\nEmail: info@ourcompany.com",
    lineItems: [
      {
        tempId: Date.now(),
        productId: "",
        description: "",
        quantity: 1,
        rate: 0,
        taxRate: 0.05,
      },
    ],
    memo: "",
    discount: 0,
    shippingCost: 0,
  });

  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Fetch vendors
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setVendorsLoading(true);
        setVendorsError(null);
        const res = await fetch("/api/vendors");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Vendor[] = await res.json();
        if (!cancelled) setVendors(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setVendorsError("Failed to load vendors");
        console.error("Vendor fetch error:", e);
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch company details
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCompanyLoading(true);
        setCompanyError(null);
        const res = await fetch("/api/company_details");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: CompanyDetails = await res.json();
        if (!cancelled) setCompanyDetails(data);
      } catch (e) {
        if (!cancelled) setCompanyError("Failed to load company details");
        console.error("Company details fetch error:", e);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handlers
  const handleVendorChange = (vendorId: string) => {
    setFormData((prev) => ({ ...prev, vendorId }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "shippingCost" || name === "discount") {
      const num = Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: Number.isFinite(num) ? num : 0,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (
    tempId: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated: LineItem = { ...item, [field]: value as any };

        if (field === "productId") {
          const product = mockProducts.find(
            (p) => p.id?.toString() === (value as string)?.toString()
          );
          if (product) {
            updated.description = product.name;
            updated.rate = Number(product.unitPrice) || 0;
            if (!Number(updated.quantity)) updated.quantity = 1;
          } else {
            updated.description = "";
            updated.rate = 0;
          }
        }

        updated.quantity = Number(updated.quantity) || 0;
        updated.rate = Number(updated.rate) || 0;
        updated.taxRate = Number(updated.taxRate) || 0;

        return updated;
      }),
    }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          tempId: Date.now(),
          productId: "",
          description: "",
          quantity: 1,
          rate: 0,
          taxRate: 0.05,
        },
      ],
    }));
  };

  const incrementQty = (tempId: number) =>
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((i) =>
        i.tempId === tempId
          ? { ...i, quantity: (Number(i.quantity) || 0) + 1 }
          : i
      ),
    }));

  const decrementQty = (tempId: number) =>
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((i) =>
        i.tempId === tempId
          ? { ...i, quantity: Math.max(1, (Number(i.quantity) || 1) - 1) }
          : i
      ),
    }));

  const removeLineItem = (tempId: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.tempId !== tempId),
    }));
  };

  // Calculations (used in UI preview)
  const lineAmount = (li: LineItem) => li.quantity * li.rate;
  const lineTax = (li: LineItem) => lineAmount(li) * li.taxRate;
  const lineTotal = (li: LineItem) => lineAmount(li) + lineTax(li);

  const subtotal = formData.lineItems.reduce((s, li) => s + lineAmount(li), 0);
  const totalTax = formData.lineItems.reduce((s, li) => s + lineTax(li), 0);
  const totalAmount =
    subtotal -
    (formData.discount || 0) +
    totalTax +
    (formData.shippingCost || 0);

 // Build payload for /api/purchase-orders
function buildPurchaseOrderPayload() {
  const items = formData.lineItems.map((it) => {
    const quantity = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    const tax_rate = Number(it.taxRate) || 0;        // e.g. 0.18 for 18%
    const amount = quantity * rate;                   // before tax
    const total_amount = amount + amount * tax_rate;  // after tax

    // use product name if available, else fall back to productId
    const product = mockProducts.find((p) => p.id === it.productId);

    return {
      product_name: product?.name ?? it.productId,
      description: it.description ?? "",
      quantity,
      rate,
      tax_rate,
      amount,
      total_amount,
    };
  });

  // totals
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalTax = items.reduce((s, i) => s + (i.total_amount - i.amount), 0);
  const discount = Number(formData.discount ?? 0);
  const shipping_cost = Number(formData.shippingCost ?? 0);
  const grandTotal = subtotal - discount + totalTax + shipping_cost;

  return {
    vendor_id: Number(formData.vendorId),
    po_number: formData.poNumber?.trim(),
    order_date: formData.orderDate,                         // "YYYY-MM-DD" works
    expected_delivery: formData.expectedDeliveryDate || null,
    billing_address: formData.billingAddress?.trim(),
    status: "DRAFT",                                        // or omit if your schema makes it optional
    memo: formData.memo || null,
    discount,
    shipping_cost,
    subtotal,
    total_amount: grandTotal,
    currency: "INR",
    purchase_order_items: items,
  };
}



  // Submit (single, API-posting version)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionSuccess(false);

    const invalid =
      !formData.vendorId ||
      !formData.orderDate ||
      formData.lineItems.length === 0 ||
      formData.lineItems.some(
        (it) =>
          !it.productId ||
          Number(it.quantity) <= 0 ||
          Number(it.rate) <= 0 ||
          Number(it.taxRate) < 0
      );

    if (invalid) {
      alert(
        "Please fill required fields and ensure each line has product, positive quantity/rate, and non-negative tax."
      );
      setLoading(false);
      return;
    }

    try {
      const payload = buildPurchaseOrderPayload();

      const res = await fetch("/api/po/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || err?.details || `HTTP ${res.status}`);
      }

      await res.json();
      setSubmissionSuccess(true);
      router.push("/PurchaseOrder");
    } catch (err: any) {
      console.error("Submission error:", err);
      alert(err?.message || "Failed to create purchase order.");
    } finally {
      setLoading(false);
    }
  };

  // PDF
  const handleDownloadPdf = useReactToPrint({
      contentRef: poPreviewRef,
      documentTitle: `Invoice_${formData.poNumber}`,
      pageStyle: `
      /* Exact A4 with small margins */
      @page { size: A4; margin: 12mm; }
  
      /* Make colors print as shown */
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  
      /* Keep the sheet within a single page */
      .a4-sheet {
          min-height: calc(297mm - 24mm); /* 273mm */
          /* Optional: keep everything for page 1 on one page when short */
          overflow: hidden;
        }
  
   
       
      
  
      /* Tighter vertical rhythm while printing */
      .a4-sheet table { border-collapse: collapse; width: 100%; }
        .a4-sheet th, .a4-sheet td { border: 1px solid #d1d5db; } 
  
      /* Avoid accidental max-width constraints from the app layout */
      @media print {
        html, body { width: 190mm; height: 200mm; }
      }
    `,
    });

  const selectedVendor = vendors.find(
    (v) => v.vendor_id.toString() === formData.vendorId
  );

  // ---------- UI ----------//
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Create New Purchase Order
        </h1>

        {submissionSuccess && (
          <div className="bg-green-500/20 text-green-300 p-4 rounded-md mb-6 text-center animate-fade-in">
            Purchase Order created successfully! Redirecting to list...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#2D2E30] p-8 rounded-lg shadow-lg">
          {/* Left Column: Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Order Details Form
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PO Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="poNumber"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    PO Number
                  </label>
                  <input
                    type="text"
                    id="poNumber"
                    name="poNumber"
                    value={formData.poNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-gray-400 rounded-md border border-gray-600 outline-none cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendorId"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Vendor <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="vendorId"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none text-sm disabled:opacity-60"
                    required
                    disabled={vendorsLoading || !!vendorsError}
                  >
                    {vendorsLoading && (
                      <option value="">Loading vendors...</option>
                    )}
                    {vendorsError && (
                      <option value="">
                        Couldn&apos;t load vendors — retry later
                      </option>
                    )}
                    {!vendorsLoading && !vendorsError && (
                      <>
                        <option value="">Select a Vendor</option>
                        {vendors.map((vendor) => (
                          <option
                            key={vendor.vendor_id}
                            value={vendor.vendor_id}
                            style={{ color: "green", fontWeight: 600 }}
                          >
                            {vendor.vendor_name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="orderDate"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="orderDate"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="expectedDeliveryDate"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    id="expectedDeliveryDate"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Line Items
                </h3>

                <div className="space-y-5">
                  {formData.lineItems.map((item) => (
                    <div
                      key={item.tempId}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#1C1C1D] p-3 rounded-md border border-gray-700 relative"
                    >
                      {/* Product + Description + Qty (wrapped) */}
                      <div className="md:col-span-4">
                        <label className="block text-gray-400 text-xs font-medium mb-1">
                          Product/Service
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "productId",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none appearance-none text-sm"
                          required
                        >
                          <option value="">Select Item</option>
                          {mockProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-gray-400 text-xs font-medium mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          placeholder="e.g., Qty 10 of Product X"
                        />
                        <div className=" mt-2 md:col-span-2 min-w-[170px]">
                          <label className="block text-gray-400 text-xs font-medium mb-1">
                            Qty <span className="text-red-500">*</span>
                          </label>
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => decrementQty(item.tempId)}
                              className="px-2 py-1 bg-[#0A0A0B] border border-gray-600 rounded-md"
                              title="Decrease"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={String(
                                Number.isFinite(item.quantity)
                                  ? item.quantity
                                  : 1
                              )}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleLineItemChange(
                                  item.tempId,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="px-2 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm text-center w-20"
                              step="1"
                              min={1}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => incrementQty(item.tempId)}
                              className="px-2 py-1 bg-[#0A0A0B] border border-gray-600 rounded-md"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Rate */}
                      <div className="md:col-span-2">
                        <label className="block text-gray-400 text-xs font-medium mb-1">
                          Rate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.rate === 0 ? "" : item.rate}
                          onFocus={(e) => {
                            if (item.rate === 0) e.target.value = "";
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            handleLineItemChange(
                              item.tempId,
                              "rate",
                              isNaN(v) ? 0 : v
                            );
                          }}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "rate",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          step="0.01"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-400 text-xs font-medium mb-1">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={
                            item.taxRate === 0
                              ? ""
                              : (item.taxRate * 100).toString()
                          }
                          onFocus={(e) => {
                            if ((item.taxRate || 0) === 0) e.target.value = "";
                            e.target.select();
                          }}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            handleLineItemChange(
                              item.tempId,
                              "taxRate",
                              isNaN(v) ? 0 : v / 100
                            );
                          }}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "taxRate",
                              (parseFloat(e.target.value) || 0) / 100
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          step="0.01"
                          min={0}
                          placeholder="0"
                        />
                      </div>

                      <div className="md:col-span-2 flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">
                          Amount
                        </span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-gray-200 rounded-md border border-gray-600 flex items-center text-sm">
                          ₹{lineAmount(item).toFixed(2)}
                        </span>
                      </div>

                      <div className="md:col-span-2 flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">
                          Tax Amt
                        </span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-gray-200 rounded-md border border-gray-600 flex items-center text-sm">
                          ₹{lineTax(item).toFixed(2)}
                        </span>
                      </div>

                      <div className="md:col-span-2 flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">
                          Total
                        </span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-green-400 font-semibold rounded-md border border-gray-600 flex items-center text-sm">
                          ₹{lineTotal(item).toFixed(2)}
                        </span>
                      </div>

                      {formData.lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.tempId)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                          title="Remove Item"
                        >
                          <MdDelete className="text-md" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm"
                >
                  <MdAdd />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Memo & Totals Summary */}
              <div className="border-t border-gray-700 pt-6">
                <label
                  htmlFor="memo"
                  className="block text-gray-300 text-sm font-medium mb-1"
                >
                  Memo / Notes
                </label>
                <textarea
                  id="memo"
                  name="memo"
                  value={formData.memo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Add any specific instructions or notes..."
                ></textarea>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Total Tax:</span>
                    <span className="font-semibold">
                      ₹{totalTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Shipping:</span>
                    <input
                      type="number"
                      name="shippingCost"
                      value={formData.shippingCost}
                      onChange={handleChange}
                      className="w-28 px-2 py-1 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm text-right"
                      step="0.01"
                      min={0}
                    />
                  </div>
                  <div className="flex justify-between items-center text-white text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span className="text-green-400">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 border-t border-gray-700 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => router.push("/purchase-orders")}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm"
                  disabled={loading}
                >
                  <MdCancel className="text-xl" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 shadow-md transform hover:scale-105 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ImSpinner2 className="animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <MdSave className="text-xl" />
                      <span>Save PO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Preview */}
          <div className="relative border-l border-gray-700 pl-8 lg:pr-4">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Purchase Order Preview
            </h2>
            <button
              onClick={handleDownloadPdf}
              className={`absolute top-0 right-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm shadow-md transform hover:scale-105 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              <MdDownload className="text-xl" />
              <span>Download PDF</span>
            </button>

            <div
              ref={poPreviewRef}
              className="a4-sheet bg-white text-gray-900 p-8 shadow-lg mt-4"
              style={{
                width: "170mm",
                minHeight: "270mm",
                margin: "0 auto",
                fontSize: "12px",
                lineHeight: "1.5",
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    PURCHASE ORDER
                  </h1>
                  <p className="text-gray-600">
                    PO Number: {formData.poNumber}
                  </p>
                  <p className="text-gray-600">
                    Date: {new Date(formData.orderDate).toLocaleDateString()}
                  </p>
                  {formData.expectedDeliveryDate && (
                    <p className="text-gray-600">
                      Expected Delivery:{" "}
                      {new Date(
                        formData.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-900">
                    {companyDetails?.company_name || "Your Company"}
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {companyDetails?.address || "Company Address"}
                    {companyDetails?.city && `, ${companyDetails.city}`}
                    {companyDetails?.state && `, ${companyDetails.state}`}
                    {companyDetails?.pin_code &&
                      ` - ${companyDetails.pin_code}`}
                    {companyDetails?.country && `\n${companyDetails.country}`}
                    {companyDetails?.phone &&
                      `\nPhone: ${companyDetails.phone}`}
                    {companyDetails?.email &&
                      `\nEmail: ${companyDetails.email}`}
                    {companyDetails?.gst_no &&
                      `\nGST: ${companyDetails.gst_no}`}
                  </p>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">Vendor:</h3>
                <p className="text-gray-800 whitespace-pre-line">
                  {selectedVendor
                    ? selectedVendor.vendor_name
                    : "Select a Vendor"}
                  <br />
                  {selectedVendor ? selectedVendor.address : ""}
                  {selectedVendor?.gst_no && `\nGST: ${selectedVendor.gst_no}`}
                  {selectedVendor?.phone && `\nPhone: ${selectedVendor.phone}`}
                  {selectedVendor?.email && `\nEmail: ${selectedVendor.email}`}
                </p>
              </div>

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
                  {formData.lineItems.map((item) => (
                    <tr key={item.tempId}>
                      <td className="border px-3 py-2">
                        {mockProducts.find((p) => p.id === item.productId)
                          ?.name || "N/A"}
                      </td>
                      <td className="border px-3 py-2">{item.description}</td>
                      <td className="border px-3 py-2 text-right">
                        {item.quantity}
                      </td>
                      <td className="border px-3 py-2 text-right">
                        ₹{item.rate.toFixed(2)}
                      </td>
                      <td className="border px-3 py-2 text-right">
                        {(item.taxRate * 100).toFixed(2)}%
                      </td>
                      <td className="border px-3 py-2 text-right">
                        ₹{lineTax(item).toFixed(2)}
                      </td>
                      <td className="border px-3 py-2 text-right font-medium">
                        ₹{lineTotal(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-1/2 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tax:</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>₹{formData.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-20 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>

        {/* Loading/Error messages */}
        {vendorsLoading && (
          <p className="text-xs text-gray-400 mt-4">Loading vendors…</p>
        )}
        {vendorsError && (
          <p className="text-xs text-red-400 mt-2">{vendorsError}</p>
        )}
        {companyLoading && (
          <p className="text-xs text-gray-400 mt-1">Loading company details…</p>
        )}
        {companyError && (
          <p className="text-xs text-red-400 mt-1">{companyError}</p>
        )}
      </div>
    </div>
  );
};

export default NewPurchaseOrderPage;
