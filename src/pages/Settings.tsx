import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';

export default function Settings() {
  const { theme, updateTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState(theme.primary_color);
  const [turfName, setTurfName] = useState('');
  const [turfDescription, setTurfDescription] = useState('');
  const [turfImages, setTurfImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Additional business info
  const [businessInfo, setBusinessInfo] = useState({
    address: '',
    phone: '',
    email: '',
    website: '',
    openingHours: '',
    closingHours: '',
    googleMapsLink: '',
  });

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  useEffect(() => {
    setPrimaryColor(theme.primary_color);
  }, [theme.primary_color]);

  const fetchSettings = async () => {
    if (!user) return;
    const { data } = await supabase.from('app_settings').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setTurfName(data.turf_name || '');
      setTurfDescription(data.turf_description || '');
      setTurfImages(data.turf_images || []);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from('app_settings').upsert({
      user_id: user.id,
      primary_color: primaryColor,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      turf_name: turfName,
      turf_description: turfDescription,
      turf_images: turfImages,
    }, { onConflict: 'user_id' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await updateTheme({ primary_color: primaryColor });
      toast({ title: 'Settings saved', description: 'Your settings have been updated.' });
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || turfImages.length >= 5) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < Math.min(files.length, 5 - turfImages.length); i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

      const { error } = await supabase.storage.from('turf-images').upload(fileName, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('turf-images').getPublicUrl(fileName);
        newImages.push(urlData.publicUrl);
      }
    }

    setTurfImages([...turfImages, ...newImages]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setTurfImages(turfImages.filter((_, i) => i !== index));
  };

  const presetColors = ['#10B981', '#F9423A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'];

  return (
    <div className="page-container">
      <div className="page-header"><h1>Settings</h1></div>
      
      <div className="grid gap-6 max-w-3xl">
        {/* Business Info */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-lg">Business Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={turfName} onChange={(e) => setTurfName(e.target.value)} placeholder="Your Turf Name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={businessInfo.phone} onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })} placeholder="+91 9876543210" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={businessInfo.email} onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })} placeholder="contact@example.com" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={businessInfo.website} onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })} placeholder="www.example.com" className="pl-10" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea value={businessInfo.address} onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })} placeholder="Full address with landmark..." rows={2} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Google Maps Link</Label>
            <Input value={businessInfo.googleMapsLink} onChange={(e) => setBusinessInfo({ ...businessInfo, googleMapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Opening Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="time" value={businessInfo.openingHours} onChange={(e) => setBusinessInfo({ ...businessInfo, openingHours: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Closing Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="time" value={businessInfo.closingHours} onChange={(e) => setBusinessInfo({ ...businessInfo, closingHours: e.target.value })} className="pl-10" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={turfDescription} onChange={(e) => setTurfDescription(e.target.value)} placeholder="Brief description of your turf business..." rows={3} />
          </div>
        </div>

        {/* Turf Images */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-lg">Turf Images (Max 5)</h3>
          <p className="text-sm text-muted-foreground">These images will be displayed on your dashboard and public listing</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {turfImages.map((img, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                <img src={img} alt={`Turf ${i + 1}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(i)} 
                  className="absolute top-1 right-1 p-1 bg-destructive rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/50 rounded text-white text-xs">
                  {i + 1}
                </div>
              </div>
            ))}
            {turfImages.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Theme */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-lg">Theme Customization</h3>
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((color) => (
                <button 
                  key={color} 
                  onClick={() => setPrimaryColor(color)} 
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${primaryColor === color ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background' : 'border-transparent'}`} 
                  style={{ backgroundColor: color }} 
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Custom Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#10B981" className="flex-1" />
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: primaryColor + '20' }}>
            <p className="text-sm" style={{ color: primaryColor }}>Preview: This is how your primary color looks</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
