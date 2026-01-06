import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PublicAuthProvider } from "@/hooks/usePublicAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import PublicTurf from "./pages/PublicTurf";
import Auth from "./pages/Auth";
import PublicAuth from "./pages/PublicAuth";
import MyProfile from "./pages/MyProfile";
import AllTurfs from "./pages/AllTurfs";
import AdminDashboard from "./pages/AdminDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Dashboard from "./pages/Dashboard";
import Turfs from "./pages/Turfs";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Offers from "./pages/Offers";
import PromoCodes from "./pages/PromoCodes";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Loyalty from "./pages/Loyalty";
import BlockedSlots from "./pages/BlockedSlots";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PublicAuthProvider>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/turf/:id" element={<PublicTurf />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/public-auth" element={<PublicAuth />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/login" element={<PublicAuth />} />
                <Route path="/all-turfs" element={<AllTurfs />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/turfs" element={<Turfs />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/promo-codes" element={<PromoCodes />} />
                  <Route path="/loyalty" element={<Loyalty />} />
                  <Route path="/blocked-slots" element={<BlockedSlots />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </PublicAuthProvider>
  </QueryClientProvider>
);

export default App;
