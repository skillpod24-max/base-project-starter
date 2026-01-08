import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  Receipt, 
  Tag, 
  BarChart3, 
  Settings,
  LogOut,
  X,
  Award,
  Ban,
  Percent,
  Gift
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MapPin, label: 'Turfs', href: '/turfs' },
  { icon: Calendar, label: 'Bookings', href: '/bookings' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: CreditCard, label: 'Payments', href: '/payments' },
  { icon: Receipt, label: 'Expenses', href: '/expenses' },
  { icon: Tag, label: 'Offers', href: '/offers' },
  { icon: Percent, label: 'Promo Codes', href: '/promo-codes' },
  { icon: Award, label: 'Loyalty', href: '/loyalty' },
  { icon: Ban, label: 'Blocked Slots', href: '/blocked-slots' },
  { icon: Gift, label: 'First Booking Offers', href: '/first-booking-offers' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixed position on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
          "md:sticky md:top-0 md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">TurfManager</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={onClose} className="md:hidden p-1 hover:bg-accent rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "nav-item",
                  isActive ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={signOut}
            className="nav-item nav-item-inactive w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
