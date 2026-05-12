import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/transactions", label: "Transactions", end: false },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Finance Tracker</h2>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-2 text-sm",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
