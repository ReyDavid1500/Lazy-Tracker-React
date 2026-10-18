import { NavLink, Outlet } from 'react-router-dom'
import { ScanLine, Boxes, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { NavTab } from './layout.type'

const NAV_TABS: readonly NavTab[] = [
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/products', icon: Boxes, label: 'Inventory' },
  { to: '/profile', icon: UserCircle2, label: 'Account' },
]

export function Layout() {
  return (
    <div className="h-full flex flex-col md:flex-row bg-bg">
      {/* Sidebar nav — md and up */}
      <nav
        className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r md:border-surface-high md:bg-surface md:py-8 md:px-4 md:gap-1"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent-bg border border-accent/30 flex items-center justify-center shrink-0">
            <Boxes size={16} className="text-accent" aria-hidden="true" />
          </div>
          <span className="text-text-primary font-bold text-base tracking-tight">LazyTracker</span>
        </div>

        {NAV_TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-bg text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-high',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="md:max-w-3xl md:mx-auto lg:max-w-4xl xl:max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom tab nav — mobile only */}
      <nav
        className="md:hidden shrink-0 flex border-t border-surface-high bg-bg"
        aria-label="Main navigation"
      >
        {NAV_TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-accent' : 'text-text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
