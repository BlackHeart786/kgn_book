// app/components/AddTransactionModal.tsx
"use client";

import React, { useState } from 'react';
import { MdCheck, MdClose } from 'react-icons/md';


interface NewTransactionFormData {
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'spend';
}

interface AddTransactionModalProps {
    onClose: () => void;
    onSave: (data: NewTransactionFormData) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<NewTransactionFormData>({
        date: new Date().toISOString().split('T')[0], // Default to today's date
        description: '',
        category: '',
        amount: 0,
        type: 'spend', // Default to 'spend'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.description || !formData.category || formData.amount <= 0) {
            alert('Please fill in all required fields: Description, Category, and Amount must be greater than 0.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1C1C1D] rounded-lg shadow-xl w-full max-w-lg overflow-hidden text-white">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">Add New Transaction</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#007BFF] hover:bg-[#0056b3] text-white py-2 px-4 rounded-md flex items-center space-x-2"
                        >
                            <MdCheck />
                            <span>Save</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center space-x-2"
                        >
                            <MdClose />
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>

                {/* Modal Body - Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g., Monthly Salary, Coffee, Rent"
                            required
                            className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder="e.g., Food, Work, Utilities"
                            required
                            className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            required
                            className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full p-2 bg-[#2D2E30] border border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="spend">Spend</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;