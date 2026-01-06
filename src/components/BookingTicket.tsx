import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { MapPin, Clock, Calendar, User, Phone, Trophy, Check, Download, X, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BookingTicketProps {
  booking: {
    id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    total_amount: number;
    paid_amount: number;
    status: string;
  };
  turf: {
    name: string;
    sport_type: string;
    location: string | null;
  };
  customer: {
    name: string;
    phone: string;
  };
  ticketCode: string;
  onClose: () => void;
}

export function BookingTicket({ booking, turf, customer, ticketCode, onClose }: BookingTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  
  const qrData = JSON.stringify({
    code: ticketCode,
    bookingId: booking.id,
    date: booking.booking_date,
    time: booking.start_time,
  });

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    
    setDownloading(true);
    
    try {
      // Use html2canvas dynamically imported
      const html2canvas = (await import('html2canvas')).default;
      
      // Wait for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // Higher quality for mobile
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: 380, // Fixed width for consistency
        windowHeight: ticketRef.current.scrollHeight,
      });
      
      // Convert to blob for better mobile compatibility
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({ title: 'Error', description: 'Could not generate ticket image', variant: 'destructive' });
          setDownloading(false);
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `SportsArena-Ticket-${ticketCode}.png`;
        link.href = url;
        
        // For iOS Safari - open in new tab
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          // Create an image and open it
          const img = new Image();
          img.src = url;
          const newWindow = window.open('');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Booking Ticket - ${ticketCode}</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; background: #f5f5f5; }
                    img { max-width: 100%; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
                    p { margin-top: 20px; color: #666; font-family: system-ui; text-align: center; }
                    button { margin-top: 16px; padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; }
                  </style>
                </head>
                <body>
                  <img src="${url}" alt="Booking Ticket" />
                  <p>Long press on the image to save it to your Photos</p>
                  <button onclick="window.close()">Done</button>
                </body>
              </html>
            `);
          }
        } else {
          // Standard download for Android and desktop
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({ title: 'Downloaded!', description: 'Your ticket has been saved' });
        }
        
        URL.revokeObjectURL(url);
        setDownloading(false);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', description: 'Please try taking a screenshot instead', variant: 'destructive' });
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(`
🎟️ Sports Arena Booking Confirmation

📍 ${turf.name}
🏆 ${turf.sport_type}
📅 ${format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}
⏰ ${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}
💰 ₹${booking.total_amount}
🎫 Ticket: ${ticketCode}

${turf.location ? `📌 ${turf.location}` : ''}
      `.trim());
      toast({ title: 'Copied!', description: 'Booking details copied to clipboard' });
      return;
    }

    try {
      await navigator.share({
        title: `Booking at ${turf.name}`,
        text: `🎟️ ${turf.name} - ${format(new Date(booking.booking_date), 'MMM d')} at ${booking.start_time.slice(0, 5)}. Ticket: ${ticketCode}`,
      });
    } catch (err) {
      // User cancelled or share failed
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm print-ticket-container overflow-y-auto">
      <div 
        ref={ticketRef}
        className="relative bg-gradient-to-b from-emerald-50 to-white rounded-2xl w-full max-w-[360px] overflow-hidden shadow-2xl print-ticket my-4 sm:my-8"
      >
        {/* Close button - hidden on print */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%2218%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%220.1%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl">Sports Arena</h1>
                <p className="text-emerald-100 text-sm">Booking Confirmation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 mt-3">
              <Check className="w-5 h-5" />
              <span className="font-medium">Booking Confirmed!</span>
            </div>
          </div>
        </div>

        {/* Dotted separator */}
        <div className="relative">
          <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-black/80 -translate-x-1/2 print:bg-gray-200" />
          <div className="absolute right-0 top-0 w-6 h-6 rounded-full bg-black/80 translate-x-1/2 print:bg-gray-200" />
          <div className="border-t-2 border-dashed border-emerald-200 mx-8" />
        </div>

        {/* Ticket Content */}
        <div className="p-5 space-y-4">
          {/* Turf Info */}
          <div className="bg-emerald-50 rounded-xl p-4">
            <h2 className="font-bold text-xl text-emerald-900 mb-2">{turf.name}</h2>
            <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
              {turf.sport_type}
            </span>
            {turf.location && (
              <div className="flex items-start gap-2 text-emerald-700 text-sm mt-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-words">{turf.location}</span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Calendar className="w-4 h-4" />
                <span>Date</span>
              </div>
              <p className="font-bold text-gray-900">
                {format(new Date(booking.booking_date), 'EEE, MMM d')}
              </p>
              <p className="text-gray-500 text-sm">
                {format(new Date(booking.booking_date), 'yyyy')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <Clock className="w-4 h-4" />
                <span>Time</span>
              </div>
              <p className="font-bold text-gray-900">
                {booking.start_time.slice(0, 5)}
              </p>
              <p className="text-gray-500 text-sm">
                to {booking.end_time.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{customer.phone}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center bg-emerald-600 text-white rounded-xl p-4">
            <div>
              <p className="text-emerald-100 text-sm">Total Amount</p>
              <p className="text-2xl font-bold">₹{booking.total_amount}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">
                {booking.paid_amount > 0 ? 'Advance Paid' : 'Payment'}
              </p>
              <p className="font-semibold">
                {booking.paid_amount > 0 ? `₹${booking.paid_amount}` : 'Pay at Venue'}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center pt-4 border-t border-gray-200">
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
              <QRCodeSVG 
                value={qrData} 
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">Scan to verify booking</p>
            <p className="font-mono text-lg font-bold text-gray-700 mt-1 tracking-wider">{ticketCode}</p>
          </div>
        </div>

        {/* Actions - hidden on print */}
        <div className="p-4 bg-gray-50 border-t flex gap-3 print:hidden">
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={downloading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {downloading ? 'Saving...' : 'Download'}
          </Button>
        </div>
      </div>
    </div>
  );
}