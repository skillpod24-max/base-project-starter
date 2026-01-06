import { useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function NotificationBell() {
  const { user } = useAuth();
  const { isSupported, permission, subscription, requestPermission, subscribe, unsubscribe } = usePushNotifications(user?.id);
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setLoading(true);
    
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        setLoading(false);
        return;
      }
    }
    
    await subscribe();
    setLoading(false);
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    await unsubscribe();
    setLoading(false);
  };

  if (!isSupported) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {subscription ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {subscription && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${subscription ? 'bg-emerald-100' : 'bg-muted'}`}>
              {subscription ? (
                <Bell className="w-5 h-5 text-emerald-600" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {subscription ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                <Check className="w-4 h-4" />
                <span>You'll receive notifications for new bookings!</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleDisableNotifications}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get instant notifications when customers book your turf. Never miss a booking!
              </p>
              <Button 
                onClick={handleEnableNotifications}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}