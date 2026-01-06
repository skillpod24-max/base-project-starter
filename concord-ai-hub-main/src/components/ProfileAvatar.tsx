import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { usePublicAuth } from '@/hooks/usePublicAuth';
import { Button } from '@/components/ui/button';

export const ProfileAvatar = () => {
  const { user, profile, loading } = usePublicAuth();

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link to="/public-auth">
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg text-xs sm:text-sm">
          Login / Sign Up
        </Button>
      </Link>
    );
  }

  const initial = profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Link 
      to="/profile"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
        <span className="text-emerald-700 font-semibold text-lg">{initial}</span>
      </div>
      <span className="hidden sm:block text-gray-700 font-medium max-w-[100px] truncate">
        {profile?.name || 'Profile'}
      </span>
    </Link>
  );
};
