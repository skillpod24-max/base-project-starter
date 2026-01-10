import { useState, useEffect } from 'react';
import { Power, Settings, Zap, Users, Clock, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Engine {
  id: string;
  engine_type: string;
  engine_name: string;
  is_enabled: boolean;
  config: Record<string, any>;
  priority: number;
}

const engineIcons: Record<string, any> = {
  scarcity: Clock,
  social_proof: Users,
  urgency: Zap,
  loyalty: Trophy,
};

const engineDescriptions: Record<string, string> = {
  scarcity: 'Shows "Only X slots left" messages to create urgency',
  social_proof: 'Displays "Y people booked this week" notifications',
  urgency: 'Time-decay discounts and flash offers for last-minute bookings',
  loyalty: 'Progress bars and milestone rewards to encourage repeat bookings',
};

export function EnginesPanel() {
  const { toast } = useToast();
  const [engines, setEngines] = useState<Engine[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);

  useEffect(() => {
    fetchEngines();
  }, []);

  const fetchEngines = async () => {
    const { data } = await supabase
      .from('psychological_engines')
      .select('*')
      .order('priority', { ascending: true });
    
    setEngines((data as Engine[]) || []);
    setLoading(false);
  };

  const toggleEngine = async (engine: Engine) => {
    const { error } = await supabase
      .from('psychological_engines')
      .update({ is_enabled: !engine.is_enabled })
      .eq('id', engine.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchEngines();
      toast({ 
        title: engine.is_enabled ? 'Engine Disabled' : 'Engine Enabled',
        description: `${engine.engine_name} is now ${engine.is_enabled ? 'off' : 'on'}` 
      });
    }
  };

  const updateConfig = async (engine: Engine, key: string, value: any) => {
    const newConfig = { ...engine.config, [key]: value };
    
    const { error } = await supabase
      .from('psychological_engines')
      .update({ config: newConfig })
      .eq('id', engine.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchEngines();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Psychological Engines</h2>
          <p className="text-sm text-muted-foreground">Control engagement and conversion strategies</p>
        </div>
      </div>

      <div className="space-y-3">
        {engines.map((engine) => {
          const Icon = engineIcons[engine.engine_type] || Zap;
          const isExpanded = expandedEngine === engine.id;
          
          return (
            <div 
              key={engine.id} 
              className={cn(
                "bg-card border rounded-lg overflow-hidden transition-all",
                engine.is_enabled ? "border-primary/30" : "border-border opacity-70"
              )}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    engine.is_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{engine.engine_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {engineDescriptions[engine.engine_type]}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={engine.is_enabled}
                    onCheckedChange={() => toggleEngine(engine)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedEngine(isExpanded ? null : engine.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t p-4 bg-muted/30">
                  <h4 className="text-sm font-medium mb-3">Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(engine.config).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                        {typeof value === 'boolean' ? (
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => updateConfig(engine, key, checked)}
                          />
                        ) : typeof value === 'number' ? (
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => updateConfig(engine, key, parseInt(e.target.value))}
                            className="h-8"
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={(e) => updateConfig(engine, key, e.target.value)}
                            className="h-8"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {engines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No engines configured
        </div>
      )}
    </div>
  );
}
