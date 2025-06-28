// app/transactions/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import AddTransactionModal from '../components/AddTransaction'; // Import the new modal component
import { HiOutlineAdjustmentsHorizontal, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

// Define the type for a single transaction object
interface Transaction {
    id: number;
    date: string; // e.g., "2025-05-30"
    description: string;
    category: string;
    amount: number;
    type: 'income' | 'spend'; // Explicitly define transaction type
}

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock Data for demonstration
    const mockTransactions: Transaction[] = [
        { id: 1, date: '2025-05-30', description: 'Groceries', category: 'Food', amount: 1500, type: 'spend' },
        { id: 2, date: '2025-05-30', description: 'Salary', category: 'Work', amount: 50000, type: 'income' },
        { id: 3, date: '2025-05-29', description: 'Restaurant Dinner', category: 'Food', amount: 800, type: 'spend' },
        { id: 4, date: '2025-05-29', description: 'Freelance Payment', category: 'Work', amount: 10000, type: 'income' },
        { id: 5, date: '2025-05-28', description: 'Electricity Bill', category: 'Utilities', amount: 2500, type: 'spend' },
        { id: 6, date: '2025-05-28', description: 'Investment Return', category: 'Investments', amount: 2500, type: 'income' },
    ];

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setTransactions(mockTransactions);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const handleAddTransactionClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSaveNewTransaction = (newTransactionData: Omit<Transaction, 'id'>) => {
        console.log('Saving new transaction:', newTransactionData);
        const newTransaction: Transaction = {
            id: Date.now(), // Simple unique ID for mock purposes
            ...newTransactionData,
        };
        setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
        setIsModalOpen(false); // Close the modal after saving
    };

    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const spendTransactions = transactions.filter(t => t.type === 'spend');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalSpend = spendTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalSpend;

    if (loading) return <div className="text-center py-8 text-white">Loading transactions...</div>;
    if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

    return (
        <div className="flex min-h-screen bg-[#1F2023] text-white">
         

            {/* Main content area */}
            <div className="flex-1 flex flex-col p-8 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-white">Daily Transactions</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleAddTransactionClick}
                            className="bg-[#007BFF] hover:bg-[#0056b3] text-white py-2 px-4 rounded-md flex items-center space-x-2"
                        >
                            <span>+ Add Transaction</span>
                        </button>
                       
                        <button className="text-gray-400 hover:text-white">
                            <HiOutlineMagnifyingGlass size={20} />
                        </button>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#2D2E30] p-4 rounded-lg shadow-md text-center">
                        <p className="text-gray-400 text-sm">Total Income</p>
                        <p className="text-2xl font-bold text-green-400">₹{totalIncome.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-[#2D2E30] p-4 rounded-lg shadow-md text-center">
                        <p className="text-gray-400 text-sm">Total Spend</p>
                        <p className="text-2xl font-bold text-red-400">₹{totalSpend.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-[#2D2E30] p-4 rounded-lg shadow-md text-center">
                        <p className="text-gray-400 text-sm">Net Balance</p>
                        <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>₹{netBalance.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Spend Transactions Table */}
                <h2 className="text-xl font-semibold text-white mb-4">Spend Transactions</h2>
                <div className="overflow-x-auto bg-[#1C1C1D] rounded-lg shadow-md p-4 mb-8">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-[#2D2E30] text-gray-300 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">DATE</th>
                                <th className="py-3 px-6 text-left">DESCRIPTION</th>
                                <th className="py-3 px-6 text-left">CATEGORY</th>
                                <th className="py-3 px-6 text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300 text-sm font-light">
                            {spendTransactions.length > 0 ? (
                                spendTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="border-b border-gray-700 hover:bg-[#2D2E30]">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">{transaction.date}</td>
                                        <td className="py-3 px-6 text-left">{transaction.description}</td>
                                        <td className="py-3 px-6 text-left">{transaction.category}</td>
                                        <td className="py-3 px-6 text-right text-red-400">₹{transaction.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">No spend transactions recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Income Transactions Table */}
                <h2 className="text-xl font-semibold text-white mb-4">Income Transactions</h2>
                <div className="overflow-x-auto bg-[#1C1C1D] rounded-lg shadow-md p-4">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-[#2D2E30] text-gray-300 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">DATE</th>
                                <th className="py-3 px-6 text-left">DESCRIPTION</th>
                                <th className="py-3 px-6 text-left">CATEGORY</th>
                                <th className="py-3 px-6 text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300 text-sm font-light">
                            {incomeTransactions.length > 0 ? (
                                incomeTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="border-b border-gray-700 hover:bg-[#2D2E30]">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">{transaction.date}</td>
                                        <td className="py-3 px-6 text-left">{transaction.description}</td>
                                        <td className="py-3 px-6 text-left">{transaction.category}</td>
                                        <td className="py-3 px-6 text-right text-green-400">₹{transaction.amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">No income transactions recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

           
            </div>

           

            {/* Conditionally render the AddTransactionModal */}
            {isModalOpen && (
                <AddTransactionModal
                    onClose={handleCloseModal}
                    onSave={handleSaveNewTransaction}
                />
            )}
        </div>
    );
};

export default TransactionsPage;