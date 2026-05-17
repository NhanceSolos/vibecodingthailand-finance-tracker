import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "ภาพรวม" },
  { to: "/transactions", label: "รายการ" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-bold text-zinc-100 font-[Kanit]">Finance Tracker</h2>
        {user && <p className="text-xs text-zinc-500 mt-0.5 truncate">{user.email}</p>}
      </div>
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "block rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
