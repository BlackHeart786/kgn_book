"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdAdd, MdDelete, MdSave, MdCancel, MdDownload } from "react-icons/md";
import { ImSpinner2 } from "react-icons/im";

import { useReactToPrint } from "react-to-print";

interface Product {
  id: string;
  name: string;
  Hourly_rate: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Machine_1", Hourly_rate: 1200.0 },
  { id: "2", name: "Machine_2", Hourly_rate: 25.0 },
];

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
interface LineItem {
  tempId: number;
  productId: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceFormState {
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  invoiceDate: string;
  paymentTerms: string;
  dueDate: string;
  lineItems: LineItem[];
  memo: string;
  transportCost: number;
  companyAddress: string;
}

const CreateInvoicePage = () => {
  const router = useRouter();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );

  function generateInvoiceNumber() {
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
    return `INV-${datePart}${timePart}${randomPart}`;
  }

  // Printable content ref (A4 content area)
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<InvoiceFormState>({
    invoiceNumber: generateInvoiceNumber(),
    customerName: "",
    customerAddress: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    paymentTerms: "Net 30",
    dueDate: "",
    lineItems: [
      {
        tempId: Date.now(),
        productId: "",
        description: "",
        quantity: 1,
        rate: 0,
      },
    ],
    memo: "",
    transportCost: 0,
    companyAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Auto due date
  useEffect(() => {
    if (!formData.invoiceDate) return;
    const invoiceDate = new Date(formData.invoiceDate);
    let days = 0;
    switch (formData.paymentTerms) {
      case "Net 7":
        days = 7;
        break;
      case "Net 15":
        days = 15;
        break;
      case "Net 30":
        days = 30;
        break;
      case "Net 60":
        days = 60;
        break;
      default:
        days = 0;
        break;
    }
    if (days > 0) {
      invoiceDate.setDate(invoiceDate.getDate() + days);
      setFormData((prev) => ({
        ...prev,
        dueDate: invoiceDate.toISOString().split("T")[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, dueDate: formData.invoiceDate }));
    }
  }, [formData.invoiceDate, formData.paymentTerms]);

  // Fetch company details
  useEffect(() => {
    async function fetchCompanyDetails() {
      const res = await fetch("/api/company_details");
      if (res.ok) {
        const data: CompanyDetails = await res.json();
        setCompanyDetails(data);
      }
    }
    fetchCompanyDetails();
  }, []);

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "transportCost") {
      const numValue = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLineItemChange = (
    tempId: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => {
        if (item.tempId === tempId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "productId") {
            const product = mockProducts.find((p) => p.id === value);
            if (product) {
              updatedItem.description = product.name;
              updatedItem.rate = product.Hourly_rate;
            } else {
              updatedItem.description = "";
              updatedItem.rate = 0;
            }
          }
          updatedItem.quantity =
            parseFloat(updatedItem.quantity.toString()) || 0;
          updatedItem.rate = parseFloat(updatedItem.rate.toString()) || 0;
          return updatedItem;
        }
        return item;
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
        },
      ],
    }));
  };

  const removeLineItem = (tempId: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.tempId !== tempId),
    }));
  };

  // Calculations
  const calculateLineItemAmount = (item: LineItem) => item.quantity * item.rate;
  const subtotal = formData.lineItems.reduce(
    (sum, item) => sum + calculateLineItemAmount(item),
    0
  );
  const totalAmount = subtotal + (formData.transportCost || 0);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionSuccess(false);

    if (
      !formData.customerName ||
      !formData.customerAddress ||
      !formData.invoiceDate ||
      formData.lineItems.length === 0 ||
      formData.lineItems.some(
        (item) => !item.productId || item.quantity <= 0 || item.rate <= 0
      )
    ) {
      alert(
        "Please fill in all required fields and ensure line items are valid."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.customerName,
          customer_address: formData.customerAddress,
          invoice_number: formData.invoiceNumber,
          invoice_date: formData.invoiceDate,
          due_date: formData.dueDate,
          payment_terms: formData.paymentTerms,
          status: "Draft",
          memo: formData.memo,
          discount: 0,
          shipping_cost: formData.transportCost,
          subtotal,
          total_amount: totalAmount,
          currency: "INR",
          invoice_items: formData.lineItems.map((item) => ({
            product_name:
              mockProducts.find((p) => p.id === item.productId)?.name || "",
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
            total_amount: item.quantity * item.rate,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      await response.json();
      setSubmissionSuccess(true);
      setTimeout(() => {
        router.push("/invoice");
      }, 1000);
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while saving the invoice.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = useReactToPrint({
    contentRef: invoicePreviewRef,
    documentTitle: `Invoice_${formData.invoiceNumber}`,
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Create New Invoice
        </h1>

        {submissionSuccess && (
          <div className="bg-green-500/20 text-green-300 p-4 rounded-md mb-6 text-center animate-fade-in">
            Invoice created successfully! Redirecting to list...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#2D2E30] p-8 rounded-lg shadow-lg">
          {/* Left Column: Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Invoice Details Form
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="invoiceNumber"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-gray-400 rounded-md border border-gray-600 outline-none cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    required
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
                <div>
                  <label
                    htmlFor="invoiceDate"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="paymentTerms"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Payment Terms
                  </label>
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none text-sm"
                  >
                    <option value="Due on receipt">Due on receipt</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="customerAddress"
                    className="block text-gray-300 text-sm font-medium mb-1"
                  >
                    Customer Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="customerAddress"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Enter customer address here..."
                    required
                  ></textarea>
                </div>
              </div>

              {/* Line items */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Line Items
                </h3>
                <div className="space-y-4">
                  {formData.lineItems.map((item) => (
                    <div
                      key={item.tempId}
                      className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-[#1C1C1D] p-3 rounded-md border border-gray-700 relative"
                    >
                      <div className="md:col-span-2">
                        <label
                          htmlFor={`product-${item.tempId}`}
                          className="block text-gray-400 text-xs font-medium mb-1"
                        >
                          Product/Service
                        </label>
                        <select
                          id={`product-${item.tempId}`}
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
                          {mockProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label
                          htmlFor={`description-${item.tempId}`}
                          className="block text-gray-400 text-xs font-medium mb-1"
                        >
                          Description
                        </label>
                        <input
                          type="text"
                          id={`description-${item.tempId}`}
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
                      </div>
                      <div>
                        <label
                          htmlFor={`quantity-${item.tempId}`}
                          className="block text-gray-400 text-xs font-medium mb-1"
                        >
                          Qty <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={`quantity-${item.tempId}`}
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "quantity",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`rate-${item.tempId}`}
                          className="block text-gray-400 text-xs font-medium mb-1"
                        >
                          Rate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={`rate-${item.tempId}`}
                          value={item.rate}
                          onChange={(e) =>
                            handleLineItemChange(
                              item.tempId,
                              "rate",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      <div className="flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">
                          Amount
                        </span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-gray-200 rounded-md border border-gray-600 flex-grow flex items-center text-sm">
                          ₹{calculateLineItemAmount(item).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">
                          Total
                        </span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-green-400 font-semibold rounded-md border border-gray-600 flex-grow flex items-center text-sm">
                          ₹{calculateLineItemAmount(item).toFixed(2)}
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

              {/* Memo & Totals */}
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
                    <span>Transport Cost:</span>
                    <input
                      type="number"
                      name="transportCost"
                      value={formData.transportCost}
                      onChange={handleChange}
                      className="w-24 px-2 py-1 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm text-right"
                      step="0.01"
                      min="0"
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
                  onClick={() => router.push("/invoices")}
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
                      <span>Save Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Invoice Preview (A4 content area) */}
          <div className="relative border-l border-gray-700 pl-8 lg:pr-4">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Invoice Preview
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

            {/* IMPORTANT: the inner div is EXACT A4 content size (A4 minus 12mm margins) */}
            <div
              ref={invoicePreviewRef}
              className="bg-white text-gray-900 p-8  w-full mt-4 a4-sheet"
              style={{
                width: "186mm",
                minHeight: "273mm",
                boxSizing: "border-box",
              }}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                  <p className="text-sm text-gray-600">
                    Invoice # {formData.invoiceNumber}
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {companyDetails?.company_name}
                  </h2>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {companyDetails?.address && (
                      <>
                        {companyDetails.address}
                        <br />
                      </>
                    )}
                    {companyDetails?.city && <>{companyDetails.city}, </>}
                    {companyDetails?.state && <>{companyDetails.state} - </>}
                    {companyDetails?.pin_code && (
                      <>
                        {companyDetails.pin_code}
                        <br />
                      </>
                    )}
                    {companyDetails?.country && (
                      <>
                        {companyDetails.country}
                        <br />
                      </>
                    )}

                    {companyDetails?.phone && (
                      <p>
                        <span className="font-semibold text-indigo-600">
                          Phone:
                        </span>{" "}
                        {companyDetails.phone}
                      </p>
                    )}

                    {companyDetails?.email && (
                      <p>
                        <span className="font-semibold text-green-600">
                          Email:
                        </span>{" "}
                        {companyDetails.email}
                      </p>
                    )}

                    {companyDetails?.gst_no && (
                      <p>
                        <span className="font-semibold text-rose-600">
                          GST:
                        </span>{" "}
                        {companyDetails.gst_no}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                <div>
                  <p className="font-semibold text-gray-700">Bill To:</p>
                  <p className="text-gray-800 whitespace-pre-line">
                    {formData.customerName || "Customer Name"}
                    <br />
                    {formData.customerAddress || "Customer Address"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700">Invoice Date:</p>
                  <p className="text-gray-800">{formData.invoiceDate}</p>
                  <p className="font-semibold text-gray-700 mt-2">Due Date:</p>
                  <p className="text-gray-800">{formData.dueDate || "N/A"}</p>
                  <p className="font-semibold text-gray-700 mt-2">
                    Payment Terms:
                  </p>
                  <p className="text-gray-800">{formData.paymentTerms}</p>
                </div>
              </div>

              <table className="min-w-full border-collapse border border-gray-300 mb-8">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Item
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                      Qty
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                      Rate
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                      Amount
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lineItems.map((item) => (
                    <tr key={item.tempId}>
                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        {mockProducts.find((p) => p.id === item.productId)
                          ?.name || "N/A"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-xs">
                        {item.description}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">
                        ₹{item.rate.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">
                        ₹{calculateLineItemAmount(item).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs font-medium">
                        ₹{calculateLineItemAmount(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-1/2 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Cost:</span>
                    <span>₹{formData.transportCost.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span className="text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoicePage;
