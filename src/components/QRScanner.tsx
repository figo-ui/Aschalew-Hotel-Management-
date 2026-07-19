import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  title?: string;
  description?: string;
}

export default function QRScanner({ onScan, onClose, isDarkMode, title = "Scan QR Code", description = "Position the QR code within the frame" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please make sure you have granted permission.");
      }
    };

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            onScan(code.data);
            return; // Stop ticking if we found a code
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onScan]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`}>
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-zinc-800 text-zinc-200' : 'border-stone-200 text-stone-800'}`}>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-display font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-black/10 transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-500 hover:text-stone-800'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner View */}
        <div className="relative aspect-square w-full bg-black overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-500 bg-zinc-900">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none flex flex-col">
                <div className="flex-1 bg-black/40"></div>
                <div className="flex h-64">
                  <div className="flex-1 bg-black/40"></div>
                  <div className="w-64 border-2 border-amber-500/80 relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-500 -mt-0.5 -ml-0.5"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-500 -mt-0.5 -mr-0.5"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-500 -mb-0.5 -ml-0.5"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-500 -mb-0.5 -mr-0.5"></div>
                  </div>
                  <div className="flex-1 bg-black/40"></div>
                </div>
                <div className="flex-1 bg-black/40"></div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 text-center ${isDarkMode ? 'text-zinc-400 bg-zinc-900' : 'text-stone-500 bg-stone-50'}`}>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
