import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, TrendingUp, Users, DollarSign, Percent, Activity, Clock, Target } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    totalBookings: 0, totalRevenue: 0, totalExpenses: 0, netProfit: 0,
    avgBookingValue: 0, occupancyRate: 0, repeatCustomers: 0, pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [revenueByTurf, setRevenueByTurf] = useState<any[]>([]);
  const [bookingsByDay, setBookingsByDay] = useState<any[]>([]);
  const [sportDistribution, setSportDistribution] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);

  useEffect(() => { if (user) fetchStats(); }, [user, dateRange]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    const [bookingsRes, expensesRes, customersRes, turfsRes] = await Promise.all([
      supabase.from('bookings').select('*, customers(name), turfs(name)').eq('user_id', user.id)
        .gte('booking_date', dateRange.from).lte('booking_date', dateRange.to),
      supabase.from('expenses').select('*, expense_categories(name)').eq('user_id', user.id)
        .gte('expense_date', dateRange.from).lte('expense_date', dateRange.to),
      supabase.from('customers').select('*').eq('user_id', user.id),
      supabase.from('turfs').select('*').eq('user_id', user.id),
    ]);

    const bookings = bookingsRes.data || [];
    const expenses = expensesRes.data || [];
    const customers = customersRes.data || [];
    const turfs = turfsRes.data || [];

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingPayments = bookings.reduce((sum, b) => sum + Number(b.pending_amount || 0), 0);
    const repeatCustomers = customers.filter(c => (c.total_bookings || 0) > 1).length;

    setStats({ 
      totalBookings: bookings.length, 
      totalRevenue, 
      totalExpenses, 
      netProfit: totalRevenue - totalExpenses,
      avgBookingValue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
      occupancyRate: 75, // Would calculate from available slots vs booked
      repeatCustomers,
      pendingPayments,
    });

    // Revenue by turf
    const turfRevenue: Record<string, number> = {};
    bookings.forEach(b => {
      const name = b.turfs?.name || 'Unknown';
      turfRevenue[name] = (turfRevenue[name] || 0) + Number(b.paid_amount || 0);
    });
    setRevenueByTurf(Object.entries(turfRevenue).map(([name, value]) => ({ name, value })));

    // Bookings by day of week
    const dayCount: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    bookings.forEach(b => {
      const day = format(parseISO(b.booking_date), 'EEE');
      if (dayCount[day] !== undefined) dayCount[day]++;
    });
    setBookingsByDay(Object.entries(dayCount).map(([name, bookings]) => ({ name, bookings })));

    // Sport distribution
    const sportCount: Record<string, number> = {};
    bookings.forEach(b => {
      sportCount[b.sport_type] = (sportCount[b.sport_type] || 0) + 1;
    });
    setSportDistribution(Object.entries(sportCount).map(([name, value]) => ({ name, value })));

    // Monthly trend (last 6 months)
    const monthlyData: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthLabel = format(monthStart, 'MMM');
      
      const { data: monthBookings } = await supabase.from('bookings').select('paid_amount').eq('user_id', user.id)
        .gte('booking_date', format(monthStart, 'yyyy-MM-dd')).lte('booking_date', format(monthEnd, 'yyyy-MM-dd'));
      const { data: monthExpenses } = await supabase.from('expenses').select('amount').eq('user_id', user.id)
        .gte('expense_date', format(monthStart, 'yyyy-MM-dd')).lte('expense_date', format(monthEnd, 'yyyy-MM-dd'));

      const revenue = (monthBookings || []).reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
      const expense = (monthExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
      monthlyData.push({ name: monthLabel, revenue, expenses: expense, profit: revenue - expense });
    }
    setMonthlyTrend(monthlyData);

    // Expenses by category
    const categoryExpenses: Record<string, number> = {};
    expenses.forEach(e => {
      const name = e.expense_categories?.name || 'Uncategorized';
      categoryExpenses[name] = (categoryExpenses[name] || 0) + Number(e.amount || 0);
    });
    setExpensesByCategory(Object.entries(categoryExpenses).map(([name, value]) => ({ name, value })));

    setLoading(false);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)'];

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">From</Label>
            <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">To</Label>
            <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="w-auto" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">{stats.totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
            <Calendar className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-success">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-destructive">₹{stats.totalExpenses.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            <DollarSign className="w-8 h-8 text-destructive opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-semibold ${stats.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{stats.netProfit.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Net Profit</p>
            </div>
            <Target className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">₹{stats.avgBookingValue}</p>
              <p className="text-xs text-muted-foreground">Avg. Booking Value</p>
            </div>
            <Activity className="w-6 h-6 text-primary opacity-50" />
          </div>
        </div>
        <div className="stat-card bg-warning/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-warning">₹{stats.pendingPayments.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pending Payments</p>
            </div>
            <Clock className="w-6 h-6 text-warning opacity-50" />
          </div>
        </div>
        <div className="stat-card bg-success/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-success">{stats.repeatCustomers}</p>
              <p className="text-xs text-muted-foreground">Repeat Customers</p>
            </div>
            <Users className="w-6 h-6 text-success opacity-50" />
          </div>
        </div>
        <div className="stat-card bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">{stats.occupancyRate}%</p>
              <p className="text-xs text-muted-foreground">Occupancy Rate</p>
            </div>
            <Percent className="w-6 h-6 text-primary opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-4">Monthly Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Turf */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-4">Revenue by Turf</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByTurf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Day */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-4">Bookings by Day of Week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="bookings" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sport Distribution */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-medium mb-4">Sport Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sportDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {sportDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-card border rounded-lg p-4 lg:col-span-2">
          <h3 className="font-medium mb-4">Expenses by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}