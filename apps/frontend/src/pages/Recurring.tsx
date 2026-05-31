import { useState, useEffect, useCallback } from "react";
import type { CategoryResponse, RecurringResponse } from "shared";
import { TransactionType } from "shared";
import { api } from "../lib/api";

const inputCls =
  "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition";

const labelCls = "block text-sm text-zinc-400 mb-1.5";

function formatAmount(amount: number) {
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── RecurringModal ──────────────────────────────────────────────────────────

interface RecurringForm {
  amount: string;
  type: TransactionType;
  description: string;
  categoryId: string;
  dayOfMonth: string;
}

const EMPTY_FORM: RecurringForm = {
  amount: "",
  type: TransactionType.EXPENSE,
  description: "",
  categoryId: "",
  dayOfMonth: "1",
};

interface RecurringModalProps {
  editing: RecurringResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSaved: () => void;
}

function RecurringModal({ editing, categories, onClose, onSaved }: RecurringModalProps) {
  const [form, setForm] = useState<RecurringForm>(
    editing
      ? {
          amount: String(editing.amount),
          type: editing.type,
          description: editing.description,
          categoryId: editing.categoryId,
          dayOfMonth: String(editing.dayOfMonth),
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  function handleField(field: keyof RecurringForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "type") next.categoryId = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "กรุณาระบุจำนวนเงินที่ถูกต้อง";
    if (!form.description.trim()) errs.description = "กรุณาระบุรายละเอียด";
    if (!form.categoryId) errs.categoryId = "กรุณาเลือกหมวดหมู่";
    const day = parseInt(form.dayOfMonth);
    if (isNaN(day) || day < 1 || day > 31) errs.dayOfMonth = "วันที่ต้องอยู่ระหว่าง 1-31";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/api/recurring/${editing.id}`, {
          amount: parseFloat(form.amount),
          description: form.description.trim(),
          categoryId: form.categoryId,
          dayOfMonth: parseInt(form.dayOfMonth),
        });
      } else {
        await api.post("/api/recurring", {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description.trim(),
          categoryId: form.categoryId,
          dayOfMonth: parseInt(form.dayOfMonth),
        });
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 font-[Kanit]">
          {editing ? "แก้ไขรายการประจำ" : "เพิ่มรายการประจำ"}
        </h2>

        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-sm text-rose-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>ประเภท</label>
            <div
              className={`flex rounded-lg overflow-hidden border border-zinc-700 ${editing ? "opacity-50 pointer-events-none" : ""}`}
            >
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
            {editing && (
              <p className="text-zinc-500 text-xs mt-1">ไม่สามารถเปลี่ยนประเภทได้</p>
            )}
          </div>

          <div>
            <label className={labelCls}>จำนวนเงิน (฿)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleField("amount", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
            {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className={labelCls}>รายละเอียด</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="เช่น ค่าเช่า, เงินเดือน, ค่าสมัครสมาชิก"
              className={inputCls}
            />
            {errors.description && (
              <p className="text-rose-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>

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

          <div>
            <label className={labelCls}>วันที่ตัดทุกเดือน</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={form.dayOfMonth}
              onChange={(e) => handleField("dayOfMonth", e.target.value)}
              placeholder="1-31"
              className={inputCls}
            />
            {errors.dayOfMonth && (
              <p className="text-rose-400 text-xs mt-1">{errors.dayOfMonth}</p>
            )}
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
  item: RecurringResponse;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirm({ item, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/api/recurring/${item.id}`);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
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
            {item.category.icon} {item.description}
          </span>
          ?
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-sm text-rose-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg py-2.5 transition"
          >
            ยกเลิก
          </button>
          {!error && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
            >
              {loading ? "กำลังลบ..." : "ลบ"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RecurringRow ────────────────────────────────────────────────────────────

interface RecurringRowProps {
  item: RecurringResponse;
  onEdit: (item: RecurringResponse) => void;
  onDelete: (item: RecurringResponse) => void;
  onToggle: (item: RecurringResponse) => void;
}

function RecurringRow({ item, onEdit, onDelete, onToggle }: RecurringRowProps) {
  const isIncome = item.type === TransactionType.INCOME;

  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-3 transition ${
        item.active ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-800/50 opacity-60"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl shrink-0">
        {item.category.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-zinc-100 text-sm font-medium truncate">{item.description}</p>
        <p className="text-zinc-500 text-xs mt-0.5">
          {item.category.name} · ทุกวันที่ {item.dayOfMonth} ของเดือน
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
          {isIncome ? "+" : "-"}{formatAmount(item.amount)}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggle(item)}
          title={item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          className={`text-xs px-2.5 py-1.5 rounded-lg transition ${
            item.active
              ? "text-emerald-400 hover:bg-zinc-700 hover:text-emerald-300"
              : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          }`}
        >
          {item.active ? "เปิด" : "ปิด"}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="text-zinc-400 hover:text-zinc-100 text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 transition"
        >
          แก้ไข
        </button>
        <button
          onClick={() => onDelete(item)}
          className="text-zinc-400 hover:text-rose-400 text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 transition"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}

// ─── Recurring page ──────────────────────────────────────────────────────────

export default function Recurring() {
  const [items, setItems] = useState<RecurringResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringResponse | null>(null);
  const [deletingItem, setDeletingItem] = useState<RecurringResponse | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recurringData, categoryData] = await Promise.all([
        api.get<RecurringResponse[]>("/api/recurring"),
        api.get<CategoryResponse[]>("/api/categories"),
      ]);
      setItems(recurringData);
      setCategories(categoryData);
    } catch {
      null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleToggle(item: RecurringResponse) {
    try {
      await api.patch(`/api/recurring/${item.id}`, { active: !item.active });
      fetchAll();
    } catch {
      null;
    }
  }

  const active = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-100 font-[Kanit]">รายการประจำ</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition hover:scale-[1.02] active:scale-95"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-40" />
                <div className="h-3 bg-zinc-800 rounded w-24" />
              </div>
              <div className="h-4 bg-zinc-800 rounded w-20" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-sm">ยังไม่มีรายการประจำ</p>
          <p className="text-xs mt-1">เพิ่มรายการที่ตัดทุกเดือนอัตโนมัติ</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                ใช้งานอยู่ ({active.length})
              </h3>
              <div className="space-y-3">
                {active.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onEdit={(i) => {
                      setEditingItem(i);
                      setModalOpen(true);
                    }}
                    onDelete={setDeletingItem}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                ปิดใช้งาน ({inactive.length})
              </h3>
              <div className="space-y-3">
                {inactive.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onEdit={(i) => {
                      setEditingItem(i);
                      setModalOpen(true);
                    }}
                    onDelete={setDeletingItem}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <RecurringModal
          editing={editingItem}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={fetchAll}
        />
      )}

      {deletingItem && (
        <DeleteConfirm
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={fetchAll}
        />
      )}
    </div>
  );
}
