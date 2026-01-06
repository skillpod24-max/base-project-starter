import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CustomerDialog } from '@/components/dialogs/CustomerDialog';
import { DetailDialog } from '@/components/dialogs/DetailDialog';

export default function Customers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { if (user) fetchCustomers(); }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  const handleRowClick = (c: any) => { setSelected(c); setDetailOpen(true); };
  const handleEdit = () => { setDetailOpen(false); setDialogOpen(true); };
  const handleDelete = async () => {
    if (!selected || !confirm('Delete this customer?')) return;
    await supabase.from('customers').delete().eq('id', selected.id);
    toast({ title: 'Deleted' });
    setDetailOpen(false);
    fetchCustomers();
  };

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header"><h1>Customers</h1><Button onClick={() => { setSelected(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Customer</Button></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Bookings</th><th>Total Spent</th><th>Tag</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No customers found</td></tr> : filtered.map((c) => (
              <tr key={c.id} onClick={() => handleRowClick(c)} className="cursor-pointer"><td className="font-medium">{c.name}</td><td>{c.phone}</td><td>{c.total_bookings}</td><td>₹{c.total_spent}</td><td><span className={`status-badge ${c.tag === 'vip' ? 'bg-primary/10 text-primary' : c.tag === 'defaulter' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{c.tag}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={selected} onSuccess={fetchCustomers} />
      {selected && <DetailDialog open={detailOpen} onOpenChange={setDetailOpen} title="Customer Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />}
    </div>
  );
}