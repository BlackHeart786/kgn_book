"use client";

import { useState } from 'react';
import { FiPlus, FiSearch, FiPrinter, FiDownload, FiTrash2, FiEdit } from 'react-icons/fi';
import Link from 'next/link';

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample invoice data
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-2023-001',
      client: 'ABC Construction',
      date: '2023-10-15',
      dueDate: '2023-11-15',
      amount: 12500,
      status: 'paid',
    },
    {
      id: 'INV-2023-002',
      client: 'XYZ Builders',
      date: '2023-10-20',
      dueDate: '2023-11-20',
      amount: 8500,
      status: 'pending',
    },
  ]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || invoice.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100">Invoicing</h1>
        <Link 
          href="/invoice/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus /> Create Invoice
        </Link>
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
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`px-4 py-2 rounded-lg ${activeTab === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-medium">Invoice #</th>
                <th className="pb-3 text-gray-400 font-medium">Client</th>
                <th className="pb-3 text-gray-400 font-medium">Date</th>
                <th className="pb-3 text-gray-400 font-medium">Due Date</th>
                <th className="pb-3 text-gray-400 font-medium">Amount</th>
                <th className="pb-3 text-gray-400 font-medium">Status</th>
                <th className="pb-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4 text-white">{invoice.id}</td>
                  <td className="py-4 text-gray-300">{invoice.client}</td>
                  <td className="py-4 text-gray-300">{invoice.date}</td>
                  <td className="py-4 text-gray-300">{invoice.dueDate}</td>
                  <td className="py-4 text-white">₹{invoice.amount.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-400 hover:text-blue-300">
                        <FiPrinter />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-300">
                        <FiDownload />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-300">
                        <FiEdit />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-300">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}