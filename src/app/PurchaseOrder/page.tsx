// app/PurchaseOrder/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { MdAdd, MdEdit, MdDelete, MdRemoveRedEye, MdFilterList, MdSearch } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im'; // For loading state, if fetching data

// --- Mock Data (replace with API fetch in a real app) ---
interface PurchaseOrder {
  id: string; // e.g., 'PO-2023-001'
  poNumber: string;
  vendorName: string;
  orderDate: string; // YYYY-MM-DD
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Billed' | 'Cancelled';
}

const mockPurchaseOrders: PurchaseOrder[] = [
  { id: 'po_1', poNumber: 'PO-2023-001', vendorName: 'Global Supplies Inc.', orderDate: '2023-01-15', totalAmount: 1250.75, status: 'Billed' },
  { id: 'po_2', poNumber: 'PO-2023-002', vendorName: 'Tech Solutions Ltd.', orderDate: '2023-02-20', totalAmount: 3400.00, status: 'Received' },
  { id: 'po_3', poNumber: 'PO-2023-003', vendorName: 'Office Essentials Co.', orderDate: '2023-03-10', totalAmount: 560.50, status: 'Sent' },
  { id: 'po_4', poNumber: 'PO-2023-004', vendorName: 'Industrial Parts LLC', orderDate: '2023-04-05', totalAmount: 7890.20, status: 'Draft' },
  { id: 'po_5', poNumber: 'PO-2023-005', vendorName: 'Global Supplies Inc.', orderDate: '2023-05-01', totalAmount: 99.99, status: 'Cancelled' },
];

const PurchaseOrdersPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [loading, setLoading] = useState(false); // Simulate loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Simulate data fetching (if it were coming from an API)
  // useEffect(() => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     setPurchaseOrders(mockPurchaseOrders); // Replace with actual fetch
  //     setLoading(false);
  //   }, 1000);
  // }, []);

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete PO ${id}?`)) {
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
      // In a real app: make API call to delete
      console.log(`Deleted PO: ${id}`);
    }
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || po.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusClasses = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-600 text-gray-100';
      case 'Sent': return 'bg-blue-600 text-blue-100';
      case 'Received': return 'bg-green-600 text-green-100';
      case 'Billed': return 'bg-purple-600 text-purple-100';
      case 'Cancelled': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1F2023] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Purchase Orders</h1>
          <Link href="/PurchaseOrder/new" passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md flex items-center space-x-2 transition duration-200 shadow-md transform hover:scale-105">
              <MdAdd className="text-xl" />
              <span>New Purchase Order</span>
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-[#2D2E30] p-6 rounded-lg shadow-lg mb-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                    type="text"
                    placeholder="Search by PO # or Vendor..."
                    className="w-full pl-10 pr-4 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="relative">
                <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <select
                    className="w-full pl-10 pr-4 py-2 bg-[#1C1C1D] text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Received">Received</option>
                    <option value="Billed">Billed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                </div>
            </div>
        </div>


        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ImSpinner2 className="animate-spin text-blue-500 text-5xl" />
            <p className="ml-4 text-xl text-gray-400">Loading Purchase Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#2D2E30] p-8 rounded-lg shadow-lg text-center text-gray-400">
            <p className="text-xl">No Purchase Orders found {searchTerm && `for "${searchTerm}"`} {filterStatus !== 'All' && `with status "${filterStatus}"`}.</p>
            <Link href="/PurchaseOrder/new" passHref>
                <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 mx-auto transition duration-200">
                    <MdAdd />
                    <span>Create New PO</span>
                </button>
            </Link>
          </div>
        ) : (
          <div className="bg-[#2D2E30] rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#1C1C1D]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PO Number</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vendor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-[#3A3B3D] transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{po.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{po.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{po.orderDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-semibold">₹{po.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link href={`/PurchaseOrder/${po.id}`} passHref>
                            <button className="text-gray-400 hover:text-blue-400 transition-colors" title="View Details">
                              <MdRemoveRedEye className="text-lg" />
                            </button>
                          </Link>
                          <Link href={`/PurchaseOrder/${po.id}/edit`} passHref>
                            <button className="text-gray-400 hover:text-yellow-400 transition-colors" title="Edit">
                              <MdEdit className="text-lg" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(po.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <MdDelete className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;