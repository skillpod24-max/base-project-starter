import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 flex items-center px-4 border-b border-border bg-card md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-accent rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold">TurfManager</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
