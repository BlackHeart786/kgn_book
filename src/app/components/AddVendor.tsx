// src/app/components/AddVendorModal.tsx
"use client";

import React, { useState } from 'react';

// Define the interface for the form data that will be passed to onSave
export interface AddVendorFormData {
  vendorDisplayName: string; // This will map to vendor_name (required)
  firstName?: string;       // Optional, if you collect first/last name separately
  lastName?: string;        // Optional, if you collect first/last name separately
  companyName?: string;     // Optional, if vendorDisplayName is derived from it
  vendorEmail: string;      // Maps to email (required)
  phone_no?: string;        // Maps to phone (string on frontend)
  gst_no?: string;
  vendor_type?: string;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  is_active?: boolean;
  created_by?: number;
  payables?: number; // Ensure this is a number type for sending to backend
}

interface AddVendorModalProps {
  onClose: () => void;
  onSave: (data: AddVendorFormData) => void;
}

const AddVendorModal: React.FC<AddVendorModalProps> = ({ onClose, onSave }) => {
  // State for form fields
  const [vendorDisplayName, setVendorDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState(''); // Added based on previous code
  const [vendorEmail, setVendorEmail] = useState('');
  const [phone_no, setPhone_no] = useState('');
  const [gst_no, setGst_no] = useState('');
  const [vendor_type, setVendor_type] = useState('');
  const [address, setAddress] = useState('');
  const [bank_name, setBank_name] = useState('');
  const [bank_account_number, setBank_account_number] = useState('');
  const [ifsc_code, setIfsc_code] = useState('');
  const [payables, setPayables] = useState<string>(''); // Keep as string for input, convert to number on save

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!vendorDisplayName || !vendorEmail) {
      alert('Vendor Display Name and Email are required.'); // Using alert for simplicity, consider a custom modal in production
      return;
    }

    const formData: AddVendorFormData = {
      vendorDisplayName: vendorDisplayName,
      firstName: firstName || undefined, // Use undefined for empty optional fields
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      vendorEmail: vendorEmail,
      phone_no: phone_no || undefined,
      gst_no: gst_no || undefined,
      vendor_type: vendor_type || undefined,
      address: address || undefined,
      bank_name: bank_name || undefined,
      bank_account_number: bank_account_number || undefined,
      ifsc_code: ifsc_code || undefined,
      // is_active and created_by might be set on backend or have default form values
      // For simplicity, omitting if not provided by form directly, backend will handle defaults/nulls
      is_active: undefined, // Or a default like true, if it's a checkbox in your form
      created_by: undefined, // Or a specific user ID if available on the frontend
      payables: payables ? parseFloat(payables) : undefined, // Convert to number
    };

    onSave(formData);
  };

  return (
    // Modal overlay
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      {/* Modal content */}
      <div className="bg-[#1C1C1D] text-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-semibold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center text-blue-400">Add New Vendor</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Display Name (required) */}
          <div className="col-span-2">
            <label htmlFor="vendorDisplayName" className="block text-sm font-medium text-gray-300 mb-1">Vendor Display Name *</label>
            <input
              type="text"
              id="vendorDisplayName"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={vendorDisplayName}
              onChange={(e) => setVendorDisplayName(e.target.value)}
              required
            />
          </div>

          {/* First Name (optional) */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
            <input
              type="text"
              id="firstName"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name (optional) */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
            <input
              type="text"
              id="lastName"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

           {/* Company Name (optional) */}
           <div className="col-span-2">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
            <input
              type="text"
              id="companyName"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Vendor Email (required) */}
          <div className="col-span-2">
            <label htmlFor="vendorEmail" className="block text-sm font-medium text-gray-300 mb-1">Vendor Email *</label>
            <input
              type="email"
              id="vendorEmail"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              required
            />
          </div>

          {/* Phone No */}
          <div>
            <label htmlFor="phone_no" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel" // Use type="tel" for phone numbers
              id="phone_no"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={phone_no}
              onChange={(e) => setPhone_no(e.target.value)}
            />
          </div>

          {/* GST No */}
          <div>
            <label htmlFor="gst_no" className="block text-sm font-medium text-gray-300 mb-1">GST Number</label>
            <input
              type="text"
              id="gst_no"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={gst_no}
              onChange={(e) => setGst_no(e.target.value)}
            />
          </div>

          {/* Vendor Type */}
          <div>
            <label htmlFor="vendor_type" className="block text-sm font-medium text-gray-300 mb-1">Vendor Type</label>
            <input
              type="text"
              id="vendor_type"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={vendor_type}
              onChange={(e) => setVendor_type(e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Address</label>
            <textarea
              id="address"
              rows={3}
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>
          </div>

          {/* Bank Details */}
          <div>
            <label htmlFor="bank_name" className="block text-sm font-medium text-gray-300 mb-1">Bank Name</label>
            <input
              type="text"
              id="bank_name"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={bank_name}
              onChange={(e) => setBank_name(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-300 mb-1">Bank Account Number</label>
            <input
              type="text"
              id="bank_account_number"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={bank_account_number}
              onChange={(e) => setBank_account_number(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-300 mb-1">IFSC Code</label>
            <input
              type="text"
              id="ifsc_code"
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={ifsc_code}
              onChange={(e) => setIfsc_code(e.target.value)}
            />
          </div>

          {/* Payables */}
          <div>
            <label htmlFor="payables" className="block text-sm font-medium text-gray-300 mb-1">Payables</label>
            <input
              type="number" // Use type="number" for numerical input
              id="payables"
              step="0.01" // Allow decimal values
              className="w-full p-2 rounded-md bg-[#2D2E30] border border-gray-600 focus:outline-none focus:border-blue-500"
              value={payables}
              onChange={(e) => setPayables(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-span-2 flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md shadow-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-md transition-colors"
            >
              Save Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorModal;
