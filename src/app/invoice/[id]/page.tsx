"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MdDownload } from "react-icons/md";
import { useReactToPrint } from "react-to-print";

export default function InvoiceDetailsPage() {
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

  const params = useParams<{ id: string }>();
  const id = params.id;

  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoice/${id}`);
        if (!res.ok) throw new Error("Failed to fetch invoice");
        const data = await res.json();
        console.log(data);
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchInvoice();
  }, [id]);

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

  const handlePrint = useReactToPrint({
    contentRef: invoicePreviewRef,
documentTitle: invoice
    ? `Invoice-${invoice.invoice_number}`
    : `Invoice-${String(id ?? "")}`,    pageStyle: `
      @page { size: A4; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      /* Lock the printable content area to exactly 1 A4 page (after margins) */
      .a4-sheet {
        min-height: calc(297mm - 24mm); /* 273mm */
        /* Optional: keep everything for page 1 on one page when short */
        overflow: hidden;
      }

      /* Make sure tables don't add unexpected extra spacing in print */
      .a4-sheet table { border-collapse: collapse; width: 100%; }
      .a4-sheet th, .a4-sheet td { border: 1px solid #d1d5db; } 
    `,
  });

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!invoice)
    return <div className="p-8 text-red-500">Invoice not found</div>;

  return (
    <div className="min-h-screen bg-[#1F2023] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Invoice #{invoice.invoice_number}
          </h1>

          <button
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm shadow-md"
          >
            <MdDownload className="text-xl" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Preview Section */}
        <div
          ref={invoicePreviewRef}
          className="a4-sheet bg-white text-gray-900 p-8 shadow-lg"
          style={{
            // Match the print height visually on screen so you see the blank space
            minHeight: "calc(297mm - 24mm)", // 273mm
          }}
        >
          {/* --- Header --- */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
              <p className="text-sm text-gray-600">
                Invoice # {invoice.invoice_number}
              </p>
            </div>
            <div className="text-right">
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
                      <span className="font-semibold text-rose-600">GST:</span>{" "}
                      {companyDetails.gst_no}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Bill To + Dates --- */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <p className="font-semibold text-gray-700">Bill To:</p>
              <p className="text-gray-800 whitespace-pre-line">
                {invoice.customer_name}
                <br />
                {invoice.customer_address}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-700">Invoice Date:</p>
              <p className="text-gray-800">
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
              <p className="font-semibold text-gray-700 mt-2">Due Date:</p>
              <p className="text-gray-800">
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
              <p className="font-semibold text-gray-700 mt-2">Payment Terms:</p>
              <p className="text-gray-800">{invoice.payment_terms}</p>
            </div>
          </div>

          {/* --- Items Table --- */}
          <table className="min-w-full border border-gray-300 mb-8 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Item</th>
                <th className="border px-3 py-2 text-left">Description</th>
                <th className="border px-3 py-2 text-right">Qty</th>
                <th className="border px-3 py-2 text-right">Rate</th>
                <th className="border px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items.map((item: any) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2">{item.product_name}</td>
                  <td className="border px-3 py-2">{item.description}</td>
                  <td className="border px-3 py-2 text-right">
                    {item.quantity}
                  </td>
                  <td className="border px-3 py-2 text-right">₹{item.rate}</td>
                  <td className="border px-3 py-2 text-right">
                    ₹{(item.quantity * item.rate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Totals --- */}
          <div className="flex justify-end mt-10">
            <div className="w-1/2 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Cost:</span>
                <span>₹{Number(invoice.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total:</span>
                <span className="text-green-600">
                  ₹{Number(invoice.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
