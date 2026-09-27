/**
 * Browser Geolocation Service for KIZUNA.
 * Adheres strictly to privacy guidelines:
 * - Only requests position upon explicit user action ("Use my current location").
 * - Returns accurate coordinates and accuracy metrics.
 * - Provides user-friendly error messages with manual fallback options.
 */

export interface GeolocationSuccess {
  success: true;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
}

export interface GeolocationFailure {
  success: false;
  error: string;
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';
}

export type GeolocationResult = GeolocationSuccess | GeolocationFailure;

/**
 * Requests the user's current GPS position via the HTML5 Geolocation API.
 * This should ONLY be invoked in response to a user click.
 */
export async function requestBrowserLocation(options?: {
  timeoutMs?: number;
  enableHighAccuracy?: boolean;
}): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      error: 'Browser geolocation is not supported on this device. You can enter a location manually.',
      code: 'UNSUPPORTED',
    };
  }

  const timeout = options?.timeoutMs ?? 12000;
  const enableHighAccuracy = options?.enableHighAccuracy ?? true;

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy || 10),
          timestamp: position.timestamp,
        });
      },
      error => {
        let message = 'Unable to determine location. You can enter a location manually.';
        let code: GeolocationFailure['code'] = 'POSITION_UNAVAILABLE';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission was denied. You can enter a location manually.';
            code = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'GPS signal unavailable. You can enter your location manually.';
            code = 'POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            message = 'Location detection timed out. Please retry or enter your location manually.';
            code = 'TIMEOUT';
            break;
        }

        resolve({
          success: false,
          error: message,
          code,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0, // Force fresh coordinates
      }
    );
  });
}
