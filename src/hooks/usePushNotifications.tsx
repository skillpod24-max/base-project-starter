import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive booking notifications.',
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You won\'t receive push notifications.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return null;

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key (you'll need to set this up)
      // For now, we'll use a demo key - in production, generate your own
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      // Save subscription to database
      const subscriptionJson = subscription.toJSON();
      await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || ''
        }, { onConflict: 'user_id,endpoint' });

      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: 'Could not enable push notifications.',
        variant: 'destructive'
      });
      return null;
    }
  }, [isSupported, userId, toast]);

  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe();
      
      // Remove from database
      if (userId) {
        await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint);
      }
      
      setSubscription(null);
    }
  }, [subscription, userId]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}