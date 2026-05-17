import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { RegisterDto } from "shared";
import { api } from "../lib/api";

type FieldErrors = Record<string, string>;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const dto = plainToInstance(RegisterDto, form);
    const validationErrors = await validate(dto);
    if (validationErrors.length > 0) {
      const mapped: FieldErrors = {};
      for (const err of validationErrors) {
        const msg = err.constraints ? Object.values(err.constraints)[0] : undefined;
        mapped[err.property] = msg ?? "ไม่ถูกต้อง";
      }
      setErrors(mapped);
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100 font-[Kanit]">สมัครสมาชิก</h1>
          <p className="text-zinc-400 text-sm mt-1">Finance Tracker</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4"
        >
          {serverError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-400">
              {serverError}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">ชื่อ</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ชื่อของคุณ"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
            />
            {errors.name && (
              <p className="text-rose-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">อีเมล</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
            />
            {errors.email && (
              <p className="text-rose-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
            />
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition hover:scale-[1.02] active:scale-95 mt-2"
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            มีบัญชีแล้ว?{" "}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
