import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any>;
  onEdit?: () => void;
  onDelete?: () => void;
  formatters?: Record<string, (value: any) => string>;
}

const defaultFormatters: Record<string, (value: any) => string> = {
  created_at: (v) => new Date(v).toLocaleDateString(),
  updated_at: (v) => new Date(v).toLocaleDateString(),
  booking_date: (v) => new Date(v).toLocaleDateString(),
  expense_date: (v) => new Date(v).toLocaleDateString(),
  valid_from: (v) => new Date(v).toLocaleDateString(),
  valid_until: (v) => new Date(v).toLocaleDateString(),
  last_visit: (v) => v ? new Date(v).toLocaleDateString() : 'Never',
  total_amount: (v) => `₹${v}`,
  paid_amount: (v) => `₹${v || 0}`,
  pending_amount: (v) => `₹${v || 0}`,
  base_price: (v) => `₹${v}`,
  peak_hour_price: (v) => v ? `₹${v}` : '-',
  weekend_price: (v) => v ? `₹${v}` : '-',
  amount: (v) => `₹${v}`,
  total_spent: (v) => `₹${v || 0}`,
  discount_value: (v) => v.toString(),
  is_active: (v) => v ? 'Active' : 'Inactive',
  applicable_days: (v) => v?.join(', ') || 'All days',
};

const labelMap: Record<string, string> = {
  id: 'ID',
  user_id: 'User ID',
  customer_id: 'Customer',
  turf_id: 'Turf',
  created_at: 'Created',
  updated_at: 'Updated',
  booking_date: 'Booking Date',
  expense_date: 'Expense Date',
  valid_from: 'Valid From',
  valid_until: 'Valid Until',
  total_amount: 'Total Amount',
  paid_amount: 'Paid Amount',
  pending_amount: 'Pending',
  payment_status: 'Payment Status',
  payment_mode: 'Payment Mode',
  sport_type: 'Sport Type',
  slot_duration: 'Slot Duration',
  base_price: 'Base Price',
  peak_hour_price: 'Peak Hour Price',
  weekend_price: 'Weekend Price',
  operating_hours_start: 'Opens At',
  operating_hours_end: 'Closes At',
  is_active: 'Status',
  total_bookings: 'Total Bookings',
  total_spent: 'Total Spent',
  last_visit: 'Last Visit',
  discount_type: 'Discount Type',
  discount_value: 'Discount Value',
  applicable_days: 'Applicable Days',
  usage_count: 'Times Used',
};

const excludeFields = ['id', 'user_id', 'customer_id', 'turf_id', 'category_id'];

export function DetailDialog({ 
  open, 
  onOpenChange, 
  title, 
  data, 
  onEdit, 
  onDelete,
  formatters = {} 
}: DetailDialogProps) {
  const allFormatters = { ...defaultFormatters, ...formatters };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-';
    if (allFormatters[key]) return allFormatters[key](value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ') || '-';
    return String(value);
  };

  const getLabel = (key: string) => {
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayFields = Object.entries(data).filter(([key]) => !excludeFields.includes(key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {displayFields.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{getLabel(key)}</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{formatValue(key, value)}</span>
            </div>
          ))}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-4 border-t">
            {onEdit && (
              <Button onClick={onEdit} variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button onClick={onDelete} variant="destructive" className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}