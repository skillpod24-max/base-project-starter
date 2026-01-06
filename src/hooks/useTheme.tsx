import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => Promise<void>;
  loading: boolean;
}

const defaultTheme: ThemeSettings = {
  primary_color: '#F9423A',
  secondary_color: '#1a1a2e',
  accent_color: '#ff6b6b',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '4 95% 55%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeColors(theme: ThemeSettings) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(theme.primary_color);
  
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);
  root.style.setProperty('--chart-1', primaryHSL);
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      applyThemeColors(defaultTheme);
      setLoading(false);
      return;
    }

    const fetchTheme = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching theme:', error);
        applyThemeColors(defaultTheme);
      } else if (data) {
        const userTheme = {
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
        };
        setTheme(userTheme);
        applyThemeColors(userTheme);
      } else {
        applyThemeColors(defaultTheme);
      }
      setLoading(false);
    };

    fetchTheme();
  }, [user]);

  const updateTheme = async (newTheme: Partial<ThemeSettings>) => {
    if (!user) return;

    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    applyThemeColors(updatedTheme);

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        user_id: user.id,
        ...updatedTheme,
      });

    if (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
