import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Turf {
  id: string;
  name: string;
  operating_hours_start: string;
  operating_hours_end: string;
}

interface BlockedSlot {
  id: string;
  turf_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
  turfs?: { name: string };
}

export default function BlockedSlots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTurf, setSelectedTurf] = useState<string>('');
  const [blockDate, setBlockDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('23:00');
  const [reason, setReason] = useState('');
  const [filterTurf, setFilterTurf] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchTurfs();
      fetchBlockedSlots();
    }
  }, [user]);

  const fetchTurfs = async () => {
    if (!user) return;
    const { data } = await supabase.from('turfs').select('*').eq('user_id', user.id).eq('is_active', true);
    setTurfs(data || []);
  };

  const fetchBlockedSlots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blocked_slots')
      .select('*, turfs(name)')
      .eq('user_id', user.id)
      .order('block_date', { ascending: false });
    setBlockedSlots(data || []);
    setLoading(false);
  };

  const handleCreateBlock = async () => {
    if (!user || !selectedTurf || !blockDate || !reason) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('blocked_slots').insert({
      user_id: user.id,
      turf_id: selectedTurf,
      block_date: format(blockDate, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      reason,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Slot blocked successfully' });
    setDialogOpen(false);
    resetForm();
    fetchBlockedSlots();
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Remove this blocked slot?')) return;
    await supabase.from('blocked_slots').delete().eq('id', id);
    toast({ title: 'Block removed' });
    fetchBlockedSlots();
  };

  const resetForm = () => {
    setSelectedTurf('');
    setBlockDate(undefined);
    setStartTime('06:00');
    setEndTime('23:00');
    setReason('');
  };

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return times;
  };

  const filteredSlots = filterTurf === 'all' 
    ? blockedSlots 
    : blockedSlots.filter(s => s.turf_id === filterTurf);

  const upcomingBlocks = filteredSlots.filter(s => !isBefore(new Date(s.block_date), startOfDay(new Date())));
  const pastBlocks = filteredSlots.filter(s => isBefore(new Date(s.block_date), startOfDay(new Date())));

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Blocked Slots</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Block Slot
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming Blocks</p>
              <p className="text-2xl font-bold">{upcomingBlocks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Blocks</p>
              <p className="text-2xl font-bold">{blockedSlots.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Turfs</p>
              <p className="text-2xl font-bold">{turfs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <Label>Filter by Turf:</Label>
        <Select value={filterTurf} onValueChange={setFilterTurf}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Turfs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Turfs</SelectItem>
            {turfs.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Upcoming Blocks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Upcoming Blocks</h2>
        {upcomingBlocks.length === 0 ? (
          <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
            No upcoming blocked slots
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingBlocks.map((slot) => (
              <div key={slot.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{slot.turfs?.name}</h3>
                    <p className="text-sm text-muted-foreground">{format(new Date(slot.block_date), 'EEEE, MMM d, yyyy')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(slot.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                </div>
                <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
                  <p className="text-sm text-warning font-medium">{slot.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Blocks */}
      {pastBlocks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Past Blocks</h2>
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Turf</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pastBlocks.map((slot) => (
                  <tr key={slot.id} className="opacity-60">
                    <td className="font-medium">{slot.turfs?.name}</td>
                    <td>{format(new Date(slot.block_date), 'MMM d, yyyy')}</td>
                    <td>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</td>
                    <td>{slot.reason}</td>
                    <td>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(slot.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Block Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Time Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Turf *</Label>
              <Select value={selectedTurf} onValueChange={setSelectedTurf}>
                <SelectTrigger><SelectValue placeholder="Select turf" /></SelectTrigger>
                <SelectContent>
                  {turfs.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !blockDate && "text-muted-foreground")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={blockDate}
                    onSelect={setBlockDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions().map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions().map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="e.g., Maintenance, Tournament, Holiday" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBlock}>Block Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
