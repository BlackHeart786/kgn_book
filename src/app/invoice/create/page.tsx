"use client";

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useRouter } from 'next/navigation';
import { MdAdd, MdDelete, MdSave, MdCancel, MdDownload } from 'react-icons/md'; // Added MdDownload icon
import { ImSpinner2 } from 'react-icons/im';

// For PDF generation
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Mock Data for Selects ---
interface Customer {
  id: string;
  name: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

const mockCustomers: Customer[] = [
  { id: 'cust_1', name: 'Acme Corporation', address: '789 Business Blvd, Suite 101, Metropolis, DE 19701' },
  { id: 'cust_2', name: 'Widgets & Co.', address: '101 Industrial Way, Innovate City, CA 90210' },
  { id: 'cust_3', name: 'Global Retail Solutions', address: '321 Market St, Commerce Town, NY 10001' },
];

const mockProducts: Product[] = [
  { id: 'prod_1', name: 'Laptop Pro X', unitPrice: 1200.00 },
  { id: 'prod_2', name: 'Wireless Mouse', unitPrice: 25.00 },
  { id: 'prod_3', name: 'Mechanical Keyboard', unitPrice: 80.00 },
  { id: 'prod_4', name: 'Monitor 27-inch', unitPrice: 300.00 },
  { id: 'serv_1', name: 'Consulting Service (Hr)', unitPrice: 150.00 },
  { id: 'serv_2', name: 'Software License (Annual)', unitPrice: 500.00 },
];

// --- Type Definitions for Form State ---
interface LineItem {
  tempId: number; // For React key, not actual ID
  productId: string; // References mockProducts.id or actual product ID
  description: string;
  quantity: number;
  rate: number;
  taxRate: number; // e.g., 0.05 for 5%
}

interface InvoiceFormState {
  invoiceNumber: string;
  customerId: string;
  customerAddress: string; // To store the selected customer's address
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string; // e.g., "Net 30", "Due on receipt"
  lineItems: LineItem[];
  memo: string;
  discount: number;
  shippingCost: number;
  companyAddress: string; // Our company's address
}

const CreateInvoicePage = () => {
  const router = useRouter();
  const invoicePreviewRef = useRef<HTMLDivElement>(null); // Ref for the preview section
  const [formData, setFormData] = useState<InvoiceFormState>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Auto-generate simple Invoice number
    customerId: '',
    customerAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0], // Today's date
    dueDate: '', // Will be calculated
    paymentTerms: 'Net 30', // Default payment terms
    lineItems: [{ tempId: Date.now(), productId: '', description: '', quantity: 1, rate: 0, taxRate: 0.05 }],
    memo: '',
    discount: 0,
    shippingCost: 0,
    companyAddress: 'Your Company Name\nYour Company Address, City, State, Zip\nPhone: (123) 456-7890\nEmail: info@yourcompany.com', // Our company's address
  });
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Auto-fill customer address and calculate due date if customer is selected or invoice date changes
  useEffect(() => {
    const selectedCustomer = mockCustomers.find(c => c.id === formData.customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerAddress: selectedCustomer.address,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerAddress: '',
      }));
    }

    // Calculate Due Date based on Payment Terms
    if (formData.invoiceDate && formData.paymentTerms) {
      const invoiceDate = new Date(formData.invoiceDate);
      let newDueDate = new Date(invoiceDate);

      switch (formData.paymentTerms) {
        case 'Net 7':
          newDueDate.setDate(invoiceDate.getDate() + 7);
          break;
        case 'Net 15':
          newDueDate.setDate(invoiceDate.getDate() + 15);
          break;
        case 'Net 30':
          newDueDate.setDate(invoiceDate.getDate() + 30);
          break;
        case 'Net 60':
          newDueDate.setDate(invoiceDate.getDate() + 60);
          break;
        case 'Due on receipt':
          newDueDate = new Date(invoiceDate); // Due on the same day
          break;
        default:
          break;
      }
      setFormData(prev => ({
        ...prev,
        dueDate: newDueDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.customerId, formData.invoiceDate, formData.paymentTerms]);


  // Handlers for form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (
    tempId: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.tempId === tempId) {
          let updatedItem = { ...item, [field]: value };

          if (field === 'productId') {
            const product = mockProducts.find(p => p.id === value);
            if (product) {
              updatedItem.description = product.name;
              updatedItem.rate = product.unitPrice;
            } else {
              updatedItem.description = '';
              updatedItem.rate = 0;
            }
          }
          // Ensure quantity, rate, and taxRate are numbers for calculations
          updatedItem.quantity = parseFloat(updatedItem.quantity.toString()) || 0;
          updatedItem.rate = parseFloat(updatedItem.rate.toString()) || 0;
          updatedItem.taxRate = parseFloat(updatedItem.taxRate.toString()) || 0; // Ensure taxRate is number

          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { tempId: Date.now(), productId: '', description: '', quantity: 1, rate: 0, taxRate: 0.05 }],
    }));
  };

  const removeLineItem = (tempId: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.tempId !== tempId)
    }));
  };

  // Calculations
  const calculateLineItemAmount = (item: LineItem) => item.quantity * item.rate;
  const calculateLineItemTax = (item: LineItem) => calculateLineItemAmount(item) * item.taxRate;
  const calculateLineItemTotal = (item: LineItem) => calculateLineItemAmount(item) + calculateLineItemTax(item);

  const subtotal = formData.lineItems.reduce((sum, item) => sum + calculateLineItemAmount(item), 0);
  const totalTax = formData.lineItems.reduce((sum, item) => sum + calculateLineItemTax(item), 0);
  const totalAmount = subtotal - (formData.discount || 0) + totalTax + (formData.shippingCost || 0);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionSuccess(false);

    // Basic validation
    if (!formData.customerId || !formData.invoiceDate || formData.lineItems.length === 0 || formData.lineItems.some(item => !item.productId || item.quantity <= 0 || item.rate <= 0)) {
      alert('Please fill in all required fields and ensure line items have products, positive quantity, and rate.');
      setLoading(false);
      return;
    }

    console.log('Submitting Invoice:', { ...formData, subtotal, totalTax, totalAmount });

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      setSubmissionSuccess(true);
      // In a real app: send data to backend
      // const response = await fetch('/api/invoices', { method: 'POST', body: JSON.stringify(formData) });
      // if (response.ok) {
      //   setSubmissionSuccess(true);
      //   // Optionally reset form or redirect after success
      //   // setFormData(initialState);
      // } else {
      //   alert('Failed to save Invoice.');
      // }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred during submission.');
    } finally {
      setLoading(false);
      // Optionally redirect after a short delay to allow success message to be seen
      if (submissionSuccess) { // This will actually be true after the setSubmissionSuccess call above, but for demo purposes, adding a delay here.
        setTimeout(() => {
          router.push('/invoices'); // Assuming a route for listing invoices
        }, 1000);
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (invoicePreviewRef.current) {
      setLoading(true); // Indicate loading for download
      try {
        // Increase scale for better quality PDF
        const canvas = await html2canvas(invoicePreviewRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`Invoice_${formData.invoiceNumber}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedCustomer = mockCustomers.find(c => c.id === formData.customerId);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Create New Invoice</h1>

        {submissionSuccess && (
          <div className="bg-green-500/20 text-green-300 p-4 rounded-md mb-6 text-center animate-fade-in">
            Invoice created successfully! Redirecting to list...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#2D2E30] p-8 rounded-lg shadow-lg">
          {/* Left Column: Invoice Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Invoice Details Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invoiceNumber" className="block text-gray-300 text-sm font-medium mb-1">Invoice Number</label>
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
                  <label htmlFor="customerId" className="block text-gray-300 text-sm font-medium mb-1">Customer <span className="text-red-500">*</span></label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none text-sm"
                    required
                  >
                    <option value="">Select a Customer</option>
                    {mockCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="invoiceDate" className="block text-gray-300 text-sm font-medium mb-1">Invoice Date <span className="text-red-500">*</span></label>
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
                  <label htmlFor="paymentTerms" className="block text-gray-300 text-sm font-medium mb-1">Payment Terms</label>
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
                  <label htmlFor="customerAddress" className="block text-gray-300 text-sm font-medium mb-1">Customer Address</label>
                  <textarea
                    id="customerAddress"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#1C1C1D] text-gray-400 rounded-md border border-gray-600 outline-none cursor-not-allowed text-sm"
                    placeholder="Customer address will be filled automatically"
                    readOnly
                  ></textarea>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-3">Line Items</h3>
                <div className="space-y-4">
                  {formData.lineItems.map((item, index) => (
                    <div key={item.tempId} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-[#1C1C1D] p-3 rounded-md border border-gray-700 relative">
                      <div className="md:col-span-2">
                        <label htmlFor={`product-${item.tempId}`} className="block text-gray-400 text-xs font-medium mb-1">Product/Service</label>
                        <select
                          id={`product-${item.tempId}`}
                          value={item.productId}
                          onChange={(e) => handleLineItemChange(item.tempId, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none appearance-none text-sm"
                          required
                        >
                          <option value="">Select Item</option>
                          {mockProducts.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`description-${item.tempId}`} className="block text-gray-400 text-xs font-medium mb-1">Description</label>
                        <input
                          type="text"
                          id={`description-${item.tempId}`}
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.tempId, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          placeholder="e.g., Qty 10 of Product X"
                        />
                      </div>
                      <div>
                        <label htmlFor={`quantity-${item.tempId}`} className="block text-gray-400 text-xs font-medium mb-1">Qty <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          id={`quantity-${item.tempId}`}
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.tempId, 'quantity', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor={`rate-${item.tempId}`} className="block text-gray-400 text-xs font-medium mb-1">Rate <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          id={`rate-${item.tempId}`}
                          value={item.rate}
                          onChange={(e) => handleLineItemChange(item.tempId, 'rate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      {/*
                      <div>
                        <label htmlFor={`tax-rate-${item.tempId}`} className="block text-gray-400 text-xs font-medium mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          id={`tax-rate-${item.tempId}`}
                          value={item.taxRate * 100} // Display as percentage
                          onChange={(e) => handleLineItemChange(item.tempId, 'taxRate', parseFloat(e.target.value) / 100)} // Store as decimal
                          className="w-full px-3 py-2 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">Tax Amt</span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-gray-200 rounded-md border border-gray-600 flex-grow flex items-center text-sm">
                          ₹{calculateLineItemTax(item).toFixed(2)}
                        </span>
                      </div>
                      */}
                      <div className="flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">Amount</span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-gray-200 rounded-md border border-gray-600 flex-grow flex items-center text-sm">
                          ₹{calculateLineItemAmount(item).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="block text-gray-400 text-xs font-medium mb-1">Total</span>
                        <span className="px-3 py-2 bg-[#0A0A0B] text-green-400 font-semibold rounded-md border border-gray-600 flex-grow flex items-center text-sm">
                          ₹{calculateLineItemTotal(item).toFixed(2)}
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

              {/* Memo & Totals Summary for Form */}
              <div className="border-t border-gray-700 pt-6">
                <label htmlFor="memo" className="block text-gray-300 text-sm font-medium mb-1">Memo / Notes</label>
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
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Discount:</span>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      className="w-24 px-2 py-1 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Shipping Cost:</span>
                    <input
                      type="number"
                      name="shippingCost"
                      value={formData.shippingCost}
                      onChange={handleChange}
                      className="w-24 px-2 py-1 bg-[#0A0A0B] text-white rounded-md border border-gray-600 focus:border-blue-500 outline-none text-sm text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Total Tax:</span>
                    <span className="font-semibold">₹{totalTax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-white text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span className="text-green-400">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t border-gray-700 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => router.push('/invoices')} // Redirect to invoices list
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm"
                  disabled={loading}
                >
                  <MdCancel className="text-xl" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 shadow-md transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Right Column: Invoice Canvas */}
          <div className="relative border-l border-gray-700 pl-8 lg:pr-4">
            <h2 className="text-2xl font-semibold text-white mb-6">Invoice Preview</h2>
            <button
              onClick={handleDownloadPdf}
              className={`absolute top-0 right-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition duration-200 text-sm shadow-md transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              <MdDownload className="text-xl" />
              <span>Download PDF</span>
            </button>

            {/* Invoice Preview Content */}
            <div ref={invoicePreviewRef} className="bg-white text-gray-900 p-8 shadow-lg min-h-[700px] w-full mt-4" style={{ zoom: '0.85' }}> {/* Added zoom for better fit */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                  <p className="text-sm text-gray-600">Invoice # {formData.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">Your Company Name</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{formData.companyAddress}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                <div>
                  <p className="font-semibold text-gray-700">Bill To:</p>
                  <p className="text-gray-800 whitespace-pre-line">
                    {selectedCustomer ? selectedCustomer.name : 'Select a Customer'}<br />
                    {formData.customerAddress || ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700">Invoice Date:</p>
                  <p className="text-gray-800">{formData.invoiceDate}</p>
                  <p className="font-semibold text-gray-700 mt-2">Due Date:</p>
                  <p className="text-gray-800">{formData.dueDate}</p>
                  <p className="font-semibold text-gray-700 mt-2">Payment Terms:</p>
                  <p className="text-gray-800">{formData.paymentTerms}</p>
                </div>
              </div>

              <table className="min-w-full border-collapse border border-gray-300 mb-8">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Rate</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lineItems.map((item) => (
                    <tr key={item.tempId}>
                      <td className="border border-gray-300 px-3 py-2 text-xs">{mockProducts.find(p => p.id === item.productId)?.name || 'N/A'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-xs">{item.description}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">₹{item.rate.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">₹{calculateLineItemAmount(item).toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs font-medium">₹{calculateLineItemTotal(item).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Add empty rows for better visual spacing in preview */}
                  {Array.from({ length: Math.max(0, 5 - formData.lineItems.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                      <td className="border border-gray-300 px-3 py-2 h-8"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start text-sm">
                <div className="w-1/2 pr-4">
                  <p className="font-semibold text-gray-700 mb-2">Notes:</p>
                  <p className="text-gray-800 whitespace-pre-line">{formData.memo || 'N/A'}</p>
                </div>
                <div className="w-1/2 pl-4 text-right">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Discount:</span>
                    <span className="font-semibold text-gray-800">-₹{formData.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Shipping:</span>
                    <span className="font-semibold text-gray-800">₹{formData.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Total Tax:</span>
                    <span className="font-semibold text-gray-800">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-400 pt-2 mt-2">
                    <span className="text-lg font-bold text-gray-800">TOTAL:</span>
                    <span className="text-lg font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoicePage;