"use client";
import React, { useEffect, useState, useCallback } from "react";
import { HiOutlinePlusCircle,  } from "react-icons/hi";
import { useDebounce } from "../../lib/hooks/useDebounce";

interface Transaction {
  transaction_id: number;
  transaction_date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "spend";
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const debouncedKeyword = useDebounce(keyword, 500);
  const debouncedDate = useDebounce(searchDate, 500);

  const fetchTransactions = useCallback(
    async (page = 1, keywordValue = "", dateValue = "") => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.append("page", String(page));
        if (keywordValue) query.append("keyword", keywordValue);
        if (dateValue) query.append("date", dateValue);

        const res = await fetch(`/api/transactions?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTransactions(currentPage, debouncedKeyword, debouncedDate);
  }, [fetchTransactions, currentPage, debouncedKeyword, debouncedDate]);

  const incomeTransactions = transactions.filter((t) => t.type === "income");
  const spendTransactions = transactions.filter((t) => t.type === "spend");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSpend = spendTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalSpend;

  return (
    <div className="p-10 min-h-screen bg-[#1F2023] text-white space-y-10">
      <h1 className="text-3xl font-bold mb-4">Daily Financial Summary</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search description / category"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="bg-[#2D2E30] text-sm text-white px-3 py-2 rounded-md border border-gray-600"
        />
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="bg-[#2D2E30] text-sm text-white px-3 py-2 rounded-md border border-gray-600"
        />
        <button
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-sm px-3 py-2 rounded-md ml-auto"
        >
          <HiOutlinePlusCircle className="text-lg" /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2D2E30] rounded-xl p-4 text-center shadow-md">
          <p className="text-gray-400 text-xs font-medium">Total Income</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            ₹{totalIncome.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-[#2D2E30] rounded-xl p-4 text-center shadow-md">
          <p className="text-gray-400 text-xs font-medium">Total Spend</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            ₹{totalSpend.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-[#2D2E30] rounded-xl p-4 text-center shadow-md">
          <p className="text-gray-400 text-xs font-medium">Net Balance</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              netBalance >= 0 ? "text-blue-400" : "text-red-400"
            }`}
          >
            ₹{netBalance.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Loading transactions...</p>
        </div>
      )}

      {error && <p className="text-center py-6 text-red-500 text-sm">{error}</p>}

      {!loading && (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Spend Transactions</h2>
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full bg-[#2D2E30] rounded-lg text-sm">
                <thead className="uppercase bg-[#3A3B3C] text-gray-400">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {spendTransactions.length > 0 ? (
                    spendTransactions.map((t) => (
                      <tr key={t.transaction_id} className="hover:bg-[#3A3B3C]">
                        <td className="p-3">{new Date(t.transaction_date).toLocaleDateString("en-IN")}</td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3">{t.category}</td>
                        <td className="p-3 text-right text-red-400">
                          ₹{Number(t.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-5 text-center text-gray-500 text-xs">No spend transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Income Transactions</h2>
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full bg-[#2D2E30] rounded-lg text-sm">
                <thead className="uppercase bg-[#3A3B3C] text-gray-400">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {incomeTransactions.length > 0 ? (
                    incomeTransactions.map((t) => (
                      <tr key={t.transaction_id} className="hover:bg-[#3A3B3C]">
                        <td className="p-3">{new Date(t.transaction_date).toLocaleDateString("en-IN")}</td>
                        <td className="p-3">{t.description}</td>
                        <td className="p-3">{t.category}</td>
                        <td className="p-3 text-right text-green-400">
                          ₹{Number(t.amount).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-5 text-center text-gray-500 text-xs">No income transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <div className="flex justify-center gap-4 mt-10">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-300 text-sm">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TransactionsPage;
