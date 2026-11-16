
"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/axios";
import toast from "react-hot-toast";

interface Payment {
  _id: string;
  planName: string;
  amount: number;
  currency: string;
  razorpayPaymentId?: string;
  status: string;
  createdAt: string;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);

      const response = await api.get("/payment/my-payment-history");

      if (response.data.success) {
        setPayments(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Payment History Error:", error);
      toast.error(
        error.response?.data?.message || "Unable to fetch payment history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const totalAmount = payments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Payment History
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View and track all your subscription payments.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Payments
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "..." : payments.length}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              All recorded transactions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Amount Paid
            </p>
            <h2 className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : formatAmount(totalAmount, "INR")}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Total payment amount
            </p>
          </div>

        </div>

        {/* Payment Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Transaction History
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your recent subscription transactions
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : payments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                ₹
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                No Payments Yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your subscription payment history will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-6 py-5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {payment.planName || "Subscription Plan"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 font-semibold text-slate-900 dark:text-white">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                        {payment.razorpayPaymentId
                          ? `${payment.razorpayPaymentId.slice(0, 12)}...`
                          : "N/A"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(payment.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            payment.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : payment.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
