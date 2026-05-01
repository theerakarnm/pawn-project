import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Settings,
  Smartphone,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/devices', label: 'Devices', icon: Smartphone },
  { href: '/queue', label: 'Slip Queue', icon: ClipboardCheck },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/clients', label: 'LIFF Demo', icon: Smartphone },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="border-b px-4 py-4">
          <h1 className="text-sm font-semibold tracking-widest uppercase">
            PAWN Admin
          </h1>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Demo Mode — Mock Data
          </p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t p-3">
          <div className="rounded bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">
            Staff: สมชาย ใจดี (Admin)
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
