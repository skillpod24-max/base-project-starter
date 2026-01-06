import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CategoryDialog({ open, onOpenChange, onSuccess }: CategoryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchCategories();
    }
  }, [open, user]);

  const fetchCategories = async () => {
    if (!user) return;
    const { data } = await supabase.from('expense_categories').select('*').eq('user_id', user.id).order('name');
    setCategories(data || []);
  };

  const handleAdd = async () => {
    if (!user || !newCategory.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('expense_categories').insert({
      user_id: user.id,
      name: newCategory.trim(),
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewCategory('');
      fetchCategories();
      onSuccess?.();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchCategories();
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={loading || !newCategory.trim()}>
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm">{cat.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}