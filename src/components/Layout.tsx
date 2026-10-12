import { NavLink, Outlet } from 'react-router-dom'
import { ScanLine, Boxes, UserCircle2 } from 'lucide-react'

const tabs = [
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/products', icon: Boxes, label: 'Inventory' },
  { to: '/profile', icon: UserCircle2, label: 'Account' },
]

export function Layout() {
  return (
    <div className="h-full flex flex-col bg-bg">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="shrink-0 flex border-t border-surface-high bg-bg">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
