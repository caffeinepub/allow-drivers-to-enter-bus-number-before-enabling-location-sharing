import { useState, useEffect, useRef } from 'react';
import { haversineDistance } from '../utils/haversineDistance';

interface Coords {
  latitude: number;
  longitude: number;
}

interface ProximityAlarmState {
  isNearby: boolean;
  hasTriggered: boolean;
  distance: number | null;
  dismissAlarm: () => void;
}

const ALARM_THRESHOLD_METRES = 500;

function playBeep(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Create a sequence of beeps for the alarm
    const beepTimes = [0, 0.3, 0.6];
    beepTimes.forEach((startTime) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + startTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + startTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + 0.2);

      oscillator.start(ctx.currentTime + startTime);
      oscillator.stop(ctx.currentTime + startTime + 0.25);
    });

    // Close context after beeps finish
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Silently fail if audio is not available
  }
}

export function useProximityAlarm(
  busCoords: Coords | null,
  travellerCoords: Coords | null,
  thresholdMetres: number = ALARM_THRESHOLD_METRES
): ProximityAlarmState {
  const [isNearby, setIsNearby] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const alarmFiredRef = useRef(false);

  const dismissAlarm = () => {
    setHasTriggered(false);
  };

  useEffect(() => {
    if (!busCoords || !travellerCoords) {
      setDistance(null);
      setIsNearby(false);
      return;
    }

    const dist = haversineDistance(travellerCoords, busCoords);
    setDistance(dist);

    const nearby = dist <= thresholdMetres;
    setIsNearby(nearby);

    if (nearby && !alarmFiredRef.current) {
      // Bus just entered the threshold — fire alarm once
      alarmFiredRef.current = true;
      setHasTriggered(true);
      playBeep();
    } else if (!nearby && alarmFiredRef.current) {
      // Bus moved away — reset so alarm can fire again on next approach
      alarmFiredRef.current = false;
    }
  }, [busCoords, travellerCoords, thresholdMetres]);

  return { isNearby, hasTriggered, distance, dismissAlarm };
}
