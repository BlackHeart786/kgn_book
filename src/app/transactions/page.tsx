"use client";

import React, { useEffect, useState, useCallback } from "react";
import AddTransactionModal from "../components/AddTransaction";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface Transaction {
  id: number;
  transaction_date: string; // ✅ Correct field
  description: string;
  category: string;
  amount: number | string;
  type: "income" | "spend";
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      console.log("Fetched transactions:", data);
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddTransactionClick = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveNewTransaction = async (
    newTransactionData: Omit<Transaction, "id">
  ) => {
    try {
      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransactionData),
      });
      if (response.status !== 201)
        throw new Error("Failed to save transaction");
      await fetchTransactions();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error saving transaction.");
    }
  };

  const incomeTransactions = transactions.filter((t) => t.type === "income");
  const spendTransactions = transactions.filter((t) => t.type === "spend");

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );
  const totalSpend = spendTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );
  const netBalance = totalIncome - totalSpend;

  if (loading)
    return (
      <div className="text-center py-8 text-white">Loading transactions...</div>
    );
  if (error)
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="flex min-h-screen bg-[#1F2023] text-white">
      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Daily Transactions</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddTransactionClick}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <span>+ Add Transaction</span>
            </button>
            <button className="text-gray-400 hover:text-white">
              <HiOutlineMagnifyingGlass size={20} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#2D2E30] p-4 rounded-lg text-center shadow">
            <p className="text-gray-400 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-400">
              ₹{totalIncome.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-[#2D2E30] p-4 rounded-lg text-center shadow">
            <p className="text-gray-400 text-sm">Total Spend</p>
            <p className="text-2xl font-bold text-red-400">
              ₹{totalSpend.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-[#2D2E30] p-4 rounded-lg text-center shadow">
            <p className="text-gray-400 text-sm">Net Balance</p>
            <p
              className={`text-2xl font-bold ${
                netBalance >= 0 ? "text-blue-400" : "text-red-400"
              }`}
            >
              ₹{netBalance.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Spend Table */}
        <h2 className="text-xl font-semibold text-white mb-4">Spend Transactions</h2>
        <div className="overflow-x-auto bg-[#1C1C1D] rounded-lg shadow-md p-4 mb-8">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#2D2E30] text-gray-300 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Date</th>
                <th className="py-3 px-6 text-left">Description</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm font-light">
              {spendTransactions.length > 0 ? (
                spendTransactions.map((t) => {
                  const formattedDate = new Date(t.transaction_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={t.id} className="border-b border-gray-700 hover:bg-[#2D2E30]">
                      <td className="py-3 px-6 text-left">{formattedDate}</td>
                      <td className="py-3 px-6 text-left">{t.description}</td>
                      <td className="py-3 px-6 text-left">{t.category}</td>
                      <td className="py-3 px-6 text-right text-red-400">
                        ₹{Number(t.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No spend transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Income Table */}
        <h2 className="text-xl font-semibold text-white mb-4">Income Transactions</h2>
        <div className="overflow-x-auto bg-[#1C1C1D] rounded-lg shadow-md p-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#2D2E30] text-gray-300 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Date</th>
                <th className="py-3 px-6 text-left">Description</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm font-light">
              {incomeTransactions.length > 0 ? (
                incomeTransactions.map((t) => {
                  const formattedDate = new Date(t.transaction_date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={t.id} className="border-b border-gray-700 hover:bg-[#2D2E30]">
                      <td className="py-3 px-6 text-left">{formattedDate}</td>
                      <td className="py-3 px-6 text-left">{t.description}</td>
                      <td className="py-3 px-6 text-left">{t.category}</td>
                      <td className="py-3 px-6 text-right text-green-400">
                        ₹{Number(t.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No income transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
