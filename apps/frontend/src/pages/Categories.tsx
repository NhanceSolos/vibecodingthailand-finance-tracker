import { useState, useEffect, useCallback } from "react";
import type { CategoryResponse } from "shared";
import { TransactionType } from "shared";
import { api } from "../lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition";

const labelCls = "block text-sm text-zinc-400 mb-1.5";

// ─── CategoryModal ───────────────────────────────────────────────────────────

interface CategoryForm {
  name: string;
  icon: string;
  type: TransactionType;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  icon: "",
  type: TransactionType.EXPENSE,
};

interface CategoryModalProps {
  editing: CategoryResponse | null;
  onClose: () => void;
  onSaved: () => void;
}

function CategoryModal({ editing, onClose, onSaved }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryForm>(
    editing
      ? { name: editing.name, icon: editing.icon, type: editing.type }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleField(field: keyof CategoryForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "กรุณาระบุชื่อหมวด";
    if (!form.icon.trim()) errs.icon = "กรุณาใส่ emoji";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/api/categories/${editing.id}`, {
          name: form.name.trim(),
          icon: form.icon.trim(),
        });
      } else {
        await api.post("/api/categories", {
          name: form.name.trim(),
          icon: form.icon.trim(),
          type: form.type,
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
          {editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        </h2>

        {serverError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-sm text-rose-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle — disabled when editing */}
          <div>
            <label className={labelCls}>ประเภท</label>
            <div className={`flex rounded-lg overflow-hidden border border-zinc-700 ${editing ? "opacity-50 pointer-events-none" : ""}`}>
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

          {/* Icon */}
          <div>
            <label className={labelCls}>Emoji icon</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => handleField("icon", e.target.value)}
              placeholder="เช่น 🍔 🚗 💊"
              maxLength={4}
              className={inputCls}
            />
            {errors.icon && (
              <p className="text-rose-400 text-xs mt-1">{errors.icon}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>ชื่อหมวด</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="เช่น อาหาร, เดินทาง, เงินเดือน"
              className={inputCls}
            />
            {errors.name && (
              <p className="text-rose-400 text-xs mt-1">{errors.name}</p>
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
  category: CategoryResponse;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirm({ category, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/api/categories/${category.id}`);
      onDeleted();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409") || msg.toLowerCase().includes("conflict") || msg.includes("transaction")) {
        setError("มีรายการใช้หมวดนี้อยู่ ย้ายรายการไปหมวดอื่นก่อน");
      } else {
        setError(msg || "ลบไม่สำเร็จ");
      }
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
          ลบหมวด{" "}
          <span className="text-zinc-200">
            {category.icon} {category.name}
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

// ─── CategoryCard ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: CategoryResponse;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
}

function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isDefault = category.userId === null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 hover:border-zinc-700 transition">
      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl shrink-0">
        {category.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-zinc-100 text-sm font-medium truncate">{category.name}</p>
        {isDefault && (
          <span className="inline-block mt-0.5 text-xs bg-zinc-700 text-zinc-400 rounded-full px-2 py-0.5">
            Default
          </span>
        )}
      </div>
      {!isDefault && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(category)}
            className="text-zinc-400 hover:text-zinc-100 text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 transition"
          >
            แก้ไข
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-zinc-400 hover:text-rose-400 text-xs px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 transition"
          >
            ลบ
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CategoryGroup ───────────────────────────────────────────────────────────

interface CategoryGroupProps {
  title: string;
  categories: CategoryResponse[];
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  loading: boolean;
}

function CategoryGroup({ title, categories, onEdit, onDelete, loading }: CategoryGroupProps) {
  return (
    <div>
      <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
        {title}
      </h3>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
              <div className="h-4 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-zinc-500 text-sm py-4">ยังไม่มีหมวดในกลุ่มนี้</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Categories page ─────────────────────────────────────────────────────────

export default function Categories() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryResponse | null>(null);
  const [deletingCat, setDeletingCat] = useState<CategoryResponse | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CategoryResponse[]>("/api/categories");
      setCategories(data);
    } catch {
      null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const expenseCategories = categories.filter(
    (c) => c.type === TransactionType.EXPENSE,
  );
  const incomeCategories = categories.filter(
    (c) => c.type === TransactionType.INCOME,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-100 font-[Kanit]">หมวดหมู่</h1>
        <button
          onClick={() => {
            setEditingCat(null);
            setModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition hover:scale-[1.02] active:scale-95"
        >
          + เพิ่มหมวดใหม่
        </button>
      </div>

      <CategoryGroup
        title="รายจ่าย"
        categories={expenseCategories}
        onEdit={(cat) => {
          setEditingCat(cat);
          setModalOpen(true);
        }}
        onDelete={setDeletingCat}
        loading={loading}
      />

      <CategoryGroup
        title="รายรับ"
        categories={incomeCategories}
        onEdit={(cat) => {
          setEditingCat(cat);
          setModalOpen(true);
        }}
        onDelete={setDeletingCat}
        loading={loading}
      />

      {modalOpen && (
        <CategoryModal
          editing={editingCat}
          onClose={() => {
            setModalOpen(false);
            setEditingCat(null);
          }}
          onSaved={fetchCategories}
        />
      )}

      {deletingCat && (
        <DeleteConfirm
          category={deletingCat}
          onClose={() => setDeletingCat(null)}
          onDeleted={fetchCategories}
        />
      )}
    </div>
  );
}
