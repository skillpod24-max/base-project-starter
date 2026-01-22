import { useState, useEffect, useRef } from 'react';
import { Gift, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveOffer {
  id: string;
  name: string;
  offer_title: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
}

interface ScratchCardOfferProps {
  offer: ActiveOffer;
  delaySeconds?: number;
  onClose: () => void;
  onReveal?: () => void;
}

export function ScratchCardOffer({ 
  offer, 
  delaySeconds = 10, 
  onClose,
  onReveal 
}: ScratchCardOfferProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Show after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds]);

  // Initialize canvas with scratch layer
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient scratch layer
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#c0c0c0');
    gradient.addColorStop(0.5, '#d4d4d4');
    gradient.addColorStop(1, '#a8a8a8');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add scratch pattern
    ctx.fillStyle = '#b8b8b8';
    for (let i = 0; i < canvas.width; i += 4) {
      for (let j = 0; j < canvas.height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }

    // Add text
    ctx.fillStyle = '#888';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '12px system-ui';
    ctx.fillText('to reveal your offer!', canvas.width / 2, canvas.height / 2 + 10);
  }, [isVisible]);

  const calculateProgress = () => {
    if (!canvasRef.current) return 0;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    const total = pixels.length / 4;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    return (transparent / total) * 100;
  };

  const scratch = (x: number, y: number) => {
    if (!canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 25, 0, Math.PI * 2);
    ctx.fill();

    // Draw line from last position for smooth scratching
    if (lastPosRef.current) {
      ctx.lineWidth = 50;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();
    }
    lastPosRef.current = { x: canvasX, y: canvasY };

    const progress = calculateProgress();
    setScratchProgress(progress);

    // Auto-reveal when 50% scratched
    if (progress >= 50 && !isRevealed) {
      revealOffer();
    }
  };

  const revealOffer = () => {
    setIsRevealed(true);
    setShowConfetti(true);
    onReveal?.();
    
    // Clear canvas completely
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleStart = () => {
    setIsScratching(true);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosRef.current = null;
  };

  const getDiscountText = () => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% OFF`;
    }
    return `₹${offer.discount_value} OFF`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-sm">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Card container */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-red-500 rounded-2xl p-1 shadow-2xl">
          <div className="bg-white rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white text-center">
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-5 h-5 animate-bounce" />
                <span className="font-bold text-lg">Special Offer!</span>
                <Gift className="w-5 h-5 animate-bounce" />
              </div>
              <p className="text-sm text-amber-100 mt-1">Scratch to reveal your discount</p>
            </div>

            {/* Scratch area */}
            <div className="relative p-4">
              {/* Confetti animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-confetti"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3'][i % 5],
                        width: '8px',
                        height: '8px',
                        borderRadius: Math.random() > 0.5 ? '50%' : '0',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Revealed offer content */}
              <div className={cn(
                "text-center py-8 px-4 transition-all duration-500",
                isRevealed ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2">
                  {getDiscountText()}
                </h3>
                <p className="text-lg font-semibold text-gray-800">
                  {offer.offer_title || offer.name}
                </p>
                {offer.description && (
                  <p className="text-sm text-gray-600 mt-2">{offer.description}</p>
                )}
              </div>

              {/* Scratch canvas overlay */}
              {!isRevealed && (
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={180}
                  className="absolute inset-4 w-[calc(100%-2rem)] h-[180px] cursor-pointer rounded-lg touch-none"
                  onMouseDown={handleStart}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleStart}
                  onTouchEnd={handleEnd}
                  onTouchMove={handleTouchMove}
                />
              )}

              {/* Progress indicator */}
              {!isRevealed && scratchProgress > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">
                  {Math.round(scratchProgress)}% revealed
                </div>
              )}
            </div>

            {/* Footer */}
            {isRevealed && (
              <div className="px-4 pb-4">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
                >
                  Book Now & Apply Offer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(300px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
