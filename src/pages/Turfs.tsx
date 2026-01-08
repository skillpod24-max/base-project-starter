import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Power, Upload, X, MapPin, Eye, EyeOff, Phone, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getAllStates, getCitiesByState } from '@/data/indianStates';

interface Turf {
  id: string;
  name: string;
  sport_type: string;
  slot_duration: number;
  base_price: number;
  price_1h: number | null;
  price_2h: number | null;
  price_3h: number | null;
  weekday_price: number | null;
  weekend_price: number | null;
  peak_hour_price: number | null;
  operating_hours_start: string;
  operating_hours_end: string;
  is_active: boolean;
  is_public: boolean | null;
  location: string | null;
  description: string | null;
  images: string[] | null;
  google_maps_url: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  state: string | null;
  city: string | null;
  amenities: string[] | null;
}

const sportTypes = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Volleyball', 'Other'];

const amenitiesList = [
  'Parking',
  'Changing Rooms',
  'Washrooms',
  'Drinking Water',
  'Floodlights',
  'First Aid',
  'Cafeteria',
  'WiFi',
  'Seating Area',
  'Equipment Rental',
  'Shower',
  'Locker',
  'Air Conditioning',
  'CCTV',
  'Security',
];

export default function Turfs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const states = getAllStates();
  
  const [formData, setFormData] = useState({
    name: '',
    sport_type: 'Football',
    slot_duration: 60,
    base_price: 0,
    price_1h: '',
    price_2h: '',
    price_3h: '',
    weekday_price: '',
    weekend_price: '',
    peak_hour_price: '',
    operating_hours_start: '06:00',
    operating_hours_end: '23:00',
    location: '',
    description: '',
    images: [] as string[],
    is_public: false,
    google_maps_url: '',
    phone_number: '',
    whatsapp_number: '',
    state: '',
    city: '',
    latitude: '',
    longitude: '',
    amenities: [] as string[],
  });

  const cities = formData.state ? getCitiesByState(formData.state) : [];

  useEffect(() => {
    if (user) fetchTurfs();
  }, [user]);

  const fetchTurfs = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('turfs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTurfs(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || formData.images.length >= 5) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `turf-${user.id}/${Date.now()}-${i}.${fileExt}`;

      const { error } = await supabase.storage.from('turf-images').upload(fileName, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('turf-images').getPublicUrl(fileName);
        newImages.push(urlData.publicUrl);
      }
    }

    setFormData({ ...formData, images: [...formData.images, ...newImages] });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const turfData = {
      user_id: user.id,
      name: formData.name,
      sport_type: formData.sport_type,
      slot_duration: formData.slot_duration,
      base_price: formData.base_price,
      price_1h: formData.price_1h ? Number(formData.price_1h) : null,
      price_2h: formData.price_2h ? Number(formData.price_2h) : null,
      price_3h: formData.price_3h ? Number(formData.price_3h) : null,
      weekday_price: formData.weekday_price ? Number(formData.weekday_price) : null,
      weekend_price: formData.weekend_price ? Number(formData.weekend_price) : null,
      peak_hour_price: formData.peak_hour_price ? Number(formData.peak_hour_price) : null,
      operating_hours_start: formData.operating_hours_start,
      operating_hours_end: formData.operating_hours_end,
      location: formData.location || null,
      description: formData.description || null,
      images: formData.images,
      is_public: formData.is_public,
      google_maps_url: formData.google_maps_url || null,
      phone_number: formData.phone_number || null,
      whatsapp_number: formData.whatsapp_number || null,
      state: formData.state || null,
      city: formData.city || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      amenities: formData.amenities,
    };

    let error;
    if (editingTurf) {
      ({ error } = await supabase.from('turfs').update(turfData).eq('id', editingTurf.id));
    } else {
      ({ error } = await supabase.from('turfs').insert(turfData));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Turf ${editingTurf ? 'updated' : 'created'} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchTurfs();
    }
  };

  const handleEdit = (turf: Turf & { latitude?: number | null; longitude?: number | null }) => {
    setEditingTurf(turf);
    setFormData({
      name: turf.name,
      sport_type: turf.sport_type,
      slot_duration: turf.slot_duration,
      base_price: turf.base_price,
      price_1h: turf.price_1h?.toString() || '',
      price_2h: turf.price_2h?.toString() || '',
      price_3h: turf.price_3h?.toString() || '',
      weekday_price: turf.weekday_price?.toString() || '',
      weekend_price: turf.weekend_price?.toString() || '',
      peak_hour_price: turf.peak_hour_price?.toString() || '',
      operating_hours_start: turf.operating_hours_start,
      operating_hours_end: turf.operating_hours_end,
      location: turf.location || '',
      description: turf.description || '',
      images: turf.images || [],
      is_public: turf.is_public || false,
      google_maps_url: turf.google_maps_url || '',
      phone_number: turf.phone_number || '',
      whatsapp_number: turf.whatsapp_number || '',
      state: turf.state || '',
      city: turf.city || '',
      latitude: turf.latitude?.toString() || '',
      longitude: turf.longitude?.toString() || '',
      amenities: turf.amenities || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this turf?')) return;

    const { error } = await supabase.from('turfs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Turf deleted successfully' });
      fetchTurfs();
    }
  };

  const toggleActive = async (turf: Turf) => {
    const { error } = await supabase.from('turfs').update({ is_active: !turf.is_active }).eq('id', turf.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchTurfs();
    }
  };

  const togglePublic = async (turf: Turf) => {
    const { error } = await supabase.from('turfs').update({ is_public: !turf.is_public }).eq('id', turf.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Turf is now ${!turf.is_public ? 'public' : 'private'}` });
      fetchTurfs();
    }
  };

  const resetForm = () => {
    setEditingTurf(null);
    setFormData({
      name: '',
      sport_type: 'Football',
      slot_duration: 60,
      base_price: 0,
      price_1h: '',
      price_2h: '',
      price_3h: '',
      weekday_price: '',
      weekend_price: '',
      peak_hour_price: '',
      operating_hours_start: '06:00',
      operating_hours_end: '23:00',
      location: '',
      description: '',
      images: [],
      is_public: false,
      google_maps_url: '',
      phone_number: '',
      whatsapp_number: '',
      state: '',
      city: '',
      latitude: '',
      longitude: '',
      amenities: [],
    });
  };

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
        <div>
          <h1>Turfs</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your turfs and facilities</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Turf</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTurf ? 'Edit Turf' : 'Add New Turf'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turf Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Sport Type</Label>
                  <Select value={formData.sport_type} onValueChange={(v) => setFormData({ ...formData, sport_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sportTypes.map((sport) => (<SelectItem key={sport} value={sport}>{sport}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address / Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Full address" />
              </div>

              {/* State and City */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v, city: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {states.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v })} disabled={!formData.state}>
                    <SelectTrigger><SelectValue placeholder={formData.state ? "Select City" : "Select State First"} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {cities.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</Label>
                  <Input value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="Contact number" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp Number</Label>
                  <Input value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} placeholder="WhatsApp number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Google Maps URL</Label>
                <Input value={formData.google_maps_url} onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })} placeholder="https://maps.google.com/..." />
              </div>

              {/* Coordinates for distance calculation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Latitude</Label>
                  <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="e.g., 11.0168" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Longitude</Label>
                  <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="e.g., 76.9558" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Add coordinates for accurate distance display to customers</p>

              {/* Amenities Multi-Select */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-2">
                  {amenitiesList.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
                          } else {
                            setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Images */}
              <div className="space-y-2">
                <Label>Images (Max 5)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img src={img} alt={`Turf ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-destructive rounded-full text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary/50" disabled={uploading}>
                      {uploading ? <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" /> : <><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload</span></>}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Operating Hours & Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Opens At</Label>
                  <Input type="time" value={formData.operating_hours_start} onChange={(e) => setFormData({ ...formData, operating_hours_start: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Closes At</Label>
                  <Input type="time" value={formData.operating_hours_end} onChange={(e) => setFormData({ ...formData, operating_hours_end: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Slot Duration</Label>
                  <Select value={formData.slot_duration.toString()} onValueChange={(v) => setFormData({ ...formData, slot_duration: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Pricing (₹)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Base Price/hr *</Label>
                    <Input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">1 Hour Package</Label>
                    <Input type="number" placeholder="Optional" value={formData.price_1h} onChange={(e) => setFormData({ ...formData, price_1h: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">2 Hour Package</Label>
                    <Input type="number" placeholder="Optional" value={formData.price_2h} onChange={(e) => setFormData({ ...formData, price_2h: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">3 Hour Package</Label>
                    <Input type="number" placeholder="Optional" value={formData.price_3h} onChange={(e) => setFormData({ ...formData, price_3h: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Weekday Price/hr</Label>
                    <Input type="number" placeholder="Optional" value={formData.weekday_price} onChange={(e) => setFormData({ ...formData, weekday_price: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Weekend Price/hr</Label>
                    <Input type="number" placeholder="Optional" value={formData.weekend_price} onChange={(e) => setFormData({ ...formData, weekend_price: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Peak Hour Price</Label>
                    <Input type="number" placeholder="Optional" value={formData.peak_hour_price} onChange={(e) => setFormData({ ...formData, peak_hour_price: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Make Public</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to book online</p>
                </div>
                <Switch checked={formData.is_public} onCheckedChange={(c) => setFormData({ ...formData, is_public: c })} />
              </div>

              <Button type="submit" className="w-full">{editingTurf ? 'Update Turf' : 'Create Turf'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {turfs.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">No turfs added yet</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Your First Turf</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => (
            <div key={turf.id} className={`bg-card border rounded-lg overflow-hidden ${!turf.is_active ? 'opacity-60' : ''}`}>
              {/* Image */}
              <div className="aspect-video bg-muted relative">
                {turf.images && turf.images.length > 0 ? (
                  <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="text-4xl">⚽</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${turf.is_active ? 'bg-success text-white' : 'bg-muted-foreground text-white'}`}>
                    {turf.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {turf.is_public && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">Public</span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{turf.name}</h3>
                    <p className="text-sm text-muted-foreground">{turf.sport_type}</p>
                  </div>
                </div>

                {turf.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{turf.location}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base</span>
                    <span className="font-medium">₹{turf.base_price}/hr</span>
                  </div>
                  {turf.price_1h && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">1hr</span>
                      <span className="font-medium">₹{turf.price_1h}</span>
                    </div>
                  )}
                  {turf.weekday_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weekday</span>
                      <span className="font-medium">₹{turf.weekday_price}</span>
                    </div>
                  )}
                  {turf.weekend_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weekend</span>
                      <span className="font-medium">₹{turf.weekend_price}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {turf.operating_hours_start.slice(0, 5)} - {turf.operating_hours_end.slice(0, 5)} • {turf.slot_duration} min slots
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(turf)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => togglePublic(turf)} title={turf.is_public ? 'Make Private' : 'Make Public'}>
                    {turf.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(turf)}>
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(turf.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
