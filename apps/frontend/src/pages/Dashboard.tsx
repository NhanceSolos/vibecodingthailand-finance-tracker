import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type {
  TransactionSummaryResponse,
  PaginatedTransactionsResponse,
  TransactionResponse,
  CategoryBreakdown,
} from "shared";
import { TransactionType } from "shared";
import { api } from "../lib/api";

const EXPENSE_COLORS = ["#f43f5e", "#fb923c", "#fbbf24", "#e879f9", "#f97316"];
const INCOME_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#14b8a6"];

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function formatMoney(amount: number): string {
  return "฿" + amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

interface SummaryCardProps {
  label: string;
  amount: number;
  colorClass: string;
}

function SummaryCard({ label, amount, colorClass }: SummaryCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <p className="text-zinc-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold font-[Kanit] ${colorClass}`}>
        {formatMoney(amount)}
      </p>
    </div>
  );
}

interface PieTooltipPayload {
  name: string;
  value: number;
  payload: CategoryBreakdown;
}

function CustomPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: PieTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
      <p className="text-zinc-100 font-medium">
        {item.icon} {item.name}
      </p>
      <p className="text-zinc-300">{formatMoney(item.total)}</p>
      <p className="text-zinc-400">{item.percentage}%</p>
    </div>
  );
}

function CategoryPieChart({
  data,
  colors,
  title,
  emptyText,
}: {
  data: CategoryBreakdown[];
  colors: string[];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col">
      <h3 className="text-zinc-300 text-sm font-medium mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 text-sm">{emptyText}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={80}
              label={({ percent }: PieLabelRenderProps) =>
                percent != null ? `${Math.round(percent * 100)}%` : ""
              }
              labelLine={false}
            >
              {data.map((_entry, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend
              formatter={(value: string) => (
                <span className="text-zinc-300 text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

interface BarTooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: BarTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  );
}

function TransactionRow({ tx }: { tx: TransactionResponse }) {
  const isIncome = tx.type === TransactionType.INCOME;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-lg shrink-0">
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
      <p
        className={`text-sm font-medium shrink-0 ${
          isIncome ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatMoney(tx.amount)}
      </p>
    </div>
  );
}

const currentDate = new Date();

export default function Dashboard() {
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [summary, setSummary] = useState<TransactionSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await api.get<TransactionSummaryResponse>(
        `/api/transactions/summary?month=${month}&year=${year}`,
      );
      setSummary(data);
    } catch {
      setError("โหลดข้อมูลสรุปไม่สำเร็จ");
    } finally {
      setLoadingSummary(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setLoadingTx(true);
    api
      .get<PaginatedTransactionsResponse>("/api/transactions?limit=10")
      .then((res) => setTransactions(res.data))
      .catch(() => setError("โหลดรายการไม่สำเร็จ"))
      .finally(() => setLoadingTx(false));
  }, []);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const dailyBarData = (summary?.dailyTotals ?? []).map((d) => ({
    date: d.date.slice(5),
    รายรับ: d.income,
    รายจ่าย: d.expense,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-zinc-100 font-[Kanit]">ภาพรวม</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-24 mb-3" />
              <div className="h-7 bg-zinc-800 rounded w-36" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="รายรับรวม"
            amount={summary?.totalIncome ?? 0}
            colorClass="text-emerald-400"
          />
          <SummaryCard
            label="รายจ่ายรวม"
            amount={summary?.totalExpense ?? 0}
            colorClass="text-rose-400"
          />
          <SummaryCard
            label="คงเหลือ"
            amount={summary?.balance ?? 0}
            colorClass="text-cyan-400"
          />
        </div>
      )}

      {/* Charts */}
      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 animate-pulse h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryPieChart
            data={summary?.byCategoryExpense ?? []}
            colors={EXPENSE_COLORS}
            title="รายจ่ายแยกหมวด"
            emptyText="ยังไม่มีข้อมูลเดือนนี้"
          />
          <CategoryPieChart
            data={summary?.byCategoryIncome ?? []}
            colors={INCOME_COLORS}
            title="รายรับแยกหมวด"
            emptyText="ยังไม่มีข้อมูลเดือนนี้"
          />

          {/* Bar chart — full width on tablet */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 md:col-span-2 lg:col-span-1 flex flex-col">
            <h3 className="text-zinc-300 text-sm font-medium mb-4">รายรับ/รายจ่ายรายวัน</h3>
            {dailyBarData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">ยังไม่มีข้อมูลเดือนนี้</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyBarData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-zinc-300 text-xs">{value}</span>
                    )}
                  />
                  <Bar dataKey="รายรับ" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="รายจ่าย" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="text-zinc-300 text-sm font-medium mb-4">รายการล่าสุด</h3>
        {loadingTx ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-zinc-800 rounded w-40" />
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                </div>
                <div className="h-4 bg-zinc-800 rounded w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">ยังไม่มีรายการ</p>
        ) : (
          <div>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
