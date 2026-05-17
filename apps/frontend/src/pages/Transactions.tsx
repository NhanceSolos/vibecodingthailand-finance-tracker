import { useState, useEffect, useCallback } from "react";
import type {
  TransactionResponse,
  PaginatedTransactionsResponse,
  CategoryResponse,
} from "shared";
import { TransactionType } from "shared";
import { api } from "../lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return (
    "฿" +
    amount.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const inputCls =
  "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition";

const labelCls = "block text-sm text-zinc-400 mb-1.5";

// ─── TransactionModal ────────────────────────────────────────────────────────

interface TransactionForm {
  amount: string;
  type: TransactionType;
  description: string;
  categoryId: string;
}

const EMPTY_FORM: TransactionForm = {
  amount: "",
  type: TransactionType.EXPENSE,
  description: "",
  categoryId: "",
};

interface TransactionModalProps {
  editing: TransactionResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSaved: () => void;
}

function TransactionModal({
  editing,
  categories,
  onClose,
  onSaved,
}: TransactionModalProps) {
  const [form, setForm] = useState<TransactionForm>(
    editing
      ? {
          amount: String(editing.amount),
          type: editing.type,
          description: editing.description ?? "",
          categoryId: editing.categoryId,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  function handleField(field: keyof TransactionForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "type" && prev.categoryId) {
        const cat = categories.find((c) => c.id === prev.categoryId);
        if (cat && cat.type !== value) next.categoryId = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "กรุณาระบุจำนวนเงินที่ถูกต้อง";
    if (!form.categoryId) errs.categoryId = "กรุณาเลือกหมวดหมู่";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      amount: parseFloat(form.amount),
      type: form.type,
      description: form.description || undefined,
      categoryId: form.categoryId,
    };

    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/api/transactions/${editing.id}`, body);
      } else {
        await api.post("/api/transactions", body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 font-[Kanit]">
          {editing ? "แก้ไขรายการ" : "เพิ่มรายการ"}
        </h2>

        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-sm text-rose-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className={labelCls}>ประเภท</label>
            <div className="flex rounded-lg overflow-hidden border border-zinc-700">
              {[
                { value: TransactionType.EXPENSE, label: "รายจ่าย" },
                { value: TransactionType.INCOME, label: "รายรับ" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleField("type", opt.value)}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    form.type === opt.value
                      ? opt.value === TransactionType.EXPENSE
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>จำนวนเงิน</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleField("amount", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
            {errors.amount && (
              <p className="text-rose-400 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>หมวดหมู่</label>
            <select
              value={form.categoryId}
              onChange={(e) => handleField("categoryId", e.target.value)}
              className={inputCls}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-rose-400 text-xs mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>รายละเอียด (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="เช่น ข้าวกลางวัน"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg py-2.5 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition hover:scale-[1.02] active:scale-95"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DeleteConfirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  tx: TransactionResponse;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirm({ tx, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/api/transactions/${tx.id}`);
      onDeleted();
      onClose();
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-base font-bold text-zinc-100">ยืนยันการลบ</h2>
        <p className="text-sm text-zinc-400">
          ลบรายการ{" "}
          <span className="text-zinc-200">
            {tx.description ?? tx.category.name}
          </span>{" "}
          {formatMoney(tx.amount)}?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg py-2.5 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
          >
            {loading ? "กำลังลบ..." : "ลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions page ───────────────────────────────────────────────────────

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | null>(null);
  const [deletingTx, setDeletingTx] = useState<TransactionResponse | null>(null);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => {
    api
      .get<CategoryResponse[]>("/api/categories")
      .then(setCategories)
      .catch(() => null);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filterType) params.set("type", filterType);
    if (filterCategoryId) params.set("categoryId", filterCategoryId);
    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);

    try {
      const res = await api.get<PaginatedTransactionsResponse>(
        `/api/transactions?${params.toString()}`,
      );
      setTransactions(res.data);
      setTotal(res.total);
    } catch {
      null;
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCategoryId, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function applyFilter() {
    setPage(1);
    fetchTransactions();
  }

  function resetFilters() {
    setFilterType("");
    setFilterCategoryId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  }

  const filterCategoryOptions = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-100 font-[Kanit]">รายการ</h1>
        <button
          onClick={() => {
            setEditingTx(null);
            setModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition hover:scale-[1.02] active:scale-95"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as TransactionType | "");
              setFilterCategoryId("");
            }}
            className={inputCls}
          >
            <option value="">ทุกประเภท</option>
            <option value={TransactionType.INCOME}>รายรับ</option>
            <option value={TransactionType.EXPENSE}>รายจ่าย</option>
          </select>

          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">ทุกหมวด</option>
            {filterCategoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className={inputCls}
            placeholder="วันเริ่มต้น"
          />

          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className={inputCls}
            placeholder="วันสิ้นสุด"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={applyFilter}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg px-4 py-2 transition"
          >
            ค้นหา
          </button>
          <button
            onClick={resetFilters}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg px-4 py-2 transition"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden sm:block bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-5 py-3 font-medium">วันที่</th>
              <th className="text-left px-5 py-3 font-medium">รายละเอียด</th>
              <th className="text-left px-5 py-3 font-medium">หมวด</th>
              <th className="text-left px-5 py-3 font-medium">ประเภท</th>
              <th className="text-right px-5 py-3 font-medium">จำนวนเงิน</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50 animate-pulse">
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-24" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-40" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-20" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-16" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-20 ml-auto" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-4 bg-zinc-800 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-zinc-500 py-12">
                  ยังไม่มีรายการ
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isIncome = tx.type === TransactionType.INCOME;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition"
                  >
                    <td className="px-5 py-3 text-zinc-400 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-zinc-100 max-w-[200px] truncate">
                      {tx.description ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-zinc-300 whitespace-nowrap">
                      {tx.category.icon} {tx.category.name}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isIncome
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {isIncome ? "รายรับ" : "รายจ่าย"}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-medium whitespace-nowrap ${
                        isIncome ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTx(tx);
                            setModalOpen(true);
                          }}
                          className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 rounded hover:bg-zinc-700 transition"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeletingTx(tx)}
                          className="text-zinc-400 hover:text-rose-400 text-xs px-2 py-1 rounded hover:bg-zinc-700 transition"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Card list — mobile */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-800 rounded w-24" />
              </div>
              <div className="h-5 bg-zinc-800 rounded w-20" />
            </div>
          ))
        ) : transactions.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">ยังไม่มีรายการ</p>
        ) : (
          transactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            return (
              <div
                key={tx.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                  {tx.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-100 text-sm truncate">
                    {tx.description ?? tx.category.name}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {tx.category.name} · {formatDate(tx.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-medium ${
                      isIncome ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatMoney(tx.amount)}
                  </p>
                  <div className="flex gap-2 mt-1 justify-end">
                    <button
                      onClick={() => {
                        setEditingTx(tx);
                        setModalOpen(true);
                      }}
                      className="text-zinc-400 hover:text-zinc-100 text-xs transition"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeletingTx(tx)}
                      className="text-zinc-400 hover:text-rose-400 text-xs transition"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            หน้า {page}/{totalPages} (ทั้งหมด {total} รายการ)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <TransactionModal
          editing={editingTx}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditingTx(null);
          }}
          onSaved={fetchTransactions}
        />
      )}
      {deletingTx && (
        <DeleteConfirm
          tx={deletingTx}
          onClose={() => setDeletingTx(null)}
          onDeleted={fetchTransactions}
        />
      )}
    </div>
  );
}
