import React from 'react';
import { Bell, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProximityAlertBannerProps {
  isVisible: boolean;
  distance: number | null;
  onDismiss: () => void;
}

export default function ProximityAlertBanner({
  isVisible,
  distance,
  onDismiss,
}: ProximityAlertBannerProps) {
  if (!isVisible) return null;

  const distanceText =
    distance !== null
      ? distance < 1000
        ? `${Math.round(distance)} m away`
        : `${(distance / 1000).toFixed(1)} km away`
      : '';

  return (
    <div
      className="relative flex items-center gap-4 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950 dark:border-amber-500 px-5 py-4 shadow-lg animate-pulse-once"
      role="alert"
      aria-live="assertive"
    >
      {/* Animated icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-md">
        <Bell className="w-6 h-6 text-white animate-bounce" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-amber-900 dark:text-amber-100 leading-tight">
          🚌 Your bus is nearby!
        </p>
        {distanceText && (
          <p className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            Approximately {distanceText}
          </p>
        )}
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Get ready to board — the bus is within 500 m of your location.
        </p>
      </div>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="flex-shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-200 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-800"
        aria-label="Dismiss alert"
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
}
