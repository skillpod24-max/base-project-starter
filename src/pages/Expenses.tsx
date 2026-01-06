import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ExpenseDialog } from '@/components/dialogs/ExpenseDialog';
import { CategoryDialog } from '@/components/dialogs/CategoryDialog';
import { DetailDialog } from '@/components/dialogs/DetailDialog';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category_id: string | null;
  expense_categories?: { name: string } | null;
}

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => { if (user) fetchExpenses(); }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;
    const { data } = await supabase.from('expenses').select('*, expense_categories(name)').eq('user_id', user.id).order('expense_date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
    setSelectedExpense(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Expense deleted' });
      fetchExpenses();
      setSelectedExpense(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const thisMonthExpenses = expenses
    .filter(e => new Date(e.expense_date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if (loading) return <div className="page-container flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenses</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />Categories
          </Button>
          <Button onClick={() => { setEditingExpense(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-2xl font-semibold text-destructive">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-semibold text-warning">₹{thisMonthExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">This Month</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No expenses recorded</td></tr>
            ) : expenses.map((e) => (
              <tr key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExpense(e)}>
                <td>{format(new Date(e.expense_date), 'MMM d, yyyy')}</td>
                <td>{e.description}</td>
                <td>{e.expense_categories?.name || '-'}</td>
                <td className="text-destructive font-medium">₹{Number(e.amount).toLocaleString()}</td>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(e)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExpenseDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        expense={editingExpense}
        onSuccess={fetchExpenses}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
      />

      <DetailDialog
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
        title="Expense Details"
        data={selectedExpense ? {
          'Date': format(new Date(selectedExpense.expense_date), 'MMM d, yyyy'),
          'Description': selectedExpense.description,
          'Category': selectedExpense.expense_categories?.name || '-',
          'Amount': `₹${Number(selectedExpense.amount).toLocaleString()}`,
        } : {}}
        onEdit={() => selectedExpense && handleEdit(selectedExpense)}
        onDelete={() => selectedExpense && handleDelete(selectedExpense.id)}
      />
    </div>
  );
}