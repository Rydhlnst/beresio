"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places";
const MAX_CALLS_PER_SESSION = 50;
const SESSION_IDLE_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

export type PlacesPrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

export type PlaceDetails = {
  place_id: string;
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location?: { lat: () => number; lng: () => number };
  };
};

type GoogleMaps = {
  maps: {
    LatLng: new (lat: number, lng: number) => unknown;
    places: {
      AutocompleteSessionToken: new () => unknown;
      AutocompleteService: new () => {
        getPlacePredictions: (
          request: {
            input: string;
            types?: string[];
            componentRestrictions?: { country: string };
            sessionToken?: unknown;
            location?: unknown;
            radius?: number;
          },
          callback: (predictions: PlacesPrediction[] | null, status: string) => void
        ) => void;
      };
      PlacesService: new (node: HTMLElement) => {
        getDetails: (
          request: {
            placeId: string;
            fields: string[];
            sessionToken?: unknown;
          },
          callback: (place: PlaceDetails | null, status: string) => void
        ) => void;
      };
      PlacesServiceStatus: {
        OK: string;
        ZERO_RESULTS: string;
        OVER_QUERY_LIMIT: string;
      };
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
    __googleMapsPromise?: Promise<void>;
  }
}

type UseGooglePlacesOptions = {
  apiKey?: string;
  country?: string;
  onManualMode?: (enabled: boolean) => void;
};

export function useGooglePlaces({ apiKey, country = "id", onManualMode }: UseGooglePlacesOptions) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const sessionTokenRef = useRef<unknown | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const placesServiceRef = useRef<InstanceType<GoogleMaps["maps"]["places"]["PlacesService"]> | null>(null);
  const autocompleteServiceRef = useRef<InstanceType<GoogleMaps["maps"]["places"]["AutocompleteService"]> | null>(null);

  const setManualModeState = useCallback((enabled: boolean) => {
    setManualMode(enabled);
    onManualMode?.(enabled);
  }, [onManualMode]);

  const scheduleSessionReset = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      sessionTokenRef.current = null;
    }, SESSION_IDLE_MS);
  }, []);

  const ensureSessionToken = useCallback(() => {
    if (!window.google?.maps?.places?.AutocompleteSessionToken) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
    scheduleSessionReset();
    return sessionTokenRef.current;
  }, [scheduleSessionReset]);

  const resetSessionToken = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const incrementCallCount = useCallback(() => {
    setApiCallCount((prev) => {
      const next = prev + 1;
      if (next > MAX_CALLS_PER_SESSION) {
        setError("Batas pencarian otomatis tercapai. Silakan gunakan mode manual.");
        setManualModeState(true);
      }
      return next;
    });
  }, [setManualModeState]);

  const loadScript = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!apiKey) {
      setError("Google Maps API key belum tersedia.");
      setManualModeState(true);
      return;
    }

    if (window.google?.maps?.places) {
      setIsReady(true);
      return;
    }

    if (!window.__googleMapsPromise) {
      window.__googleMapsPromise = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject());
          return;
        }

        const script = document.createElement("script");
        script.id = GOOGLE_MAPS_SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }

    try {
      await window.__googleMapsPromise;
      setIsReady(true);
    } catch {
      setError("Gagal memuat Google Places. Silakan input manual.");
      setManualModeState(true);
    }
  }, [apiKey, setManualModeState]);

  useEffect(() => {
    loadScript();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [loadScript]);

  const getServices = useCallback(() => {
    if (!window.google?.maps?.places) return null;
    if (!placesServiceRef.current) {
      const container = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(container);
    }
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
    return {
      placesService: placesServiceRef.current,
      autocompleteService: autocompleteServiceRef.current,
    };
  }, []);

  const runWithTimeout = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("timeout"));
      }, REQUEST_TIMEOUT_MS);
    });
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) window.clearTimeout(timeoutId);
    return result as T;
  }, []);

  const runWithRetry = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    let attempt = 0;
    let delay = 400;
    while (attempt <= MAX_RETRIES) {
      try {
        return await runWithTimeout(fn());
      } catch (err) {
        attempt += 1;
        if (attempt > MAX_RETRIES) throw err;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    throw new Error("retry_failed");
  }, [runWithTimeout]);

  const getPredictions = useCallback(
    async ({
      input,
      types,
      locationBias,
      radius = 35000,
    }: {
      input: string;
      types?: string[];
      locationBias?: { lat: number; lng: number } | null;
      radius?: number;
    }) => {
      if (manualMode) return [];
      if (!isReady) return [];
      if (!window.google?.maps?.places) return [];

      if (apiCallCount >= MAX_CALLS_PER_SESSION) {
        setManualModeState(true);
        return [];
      }

      const services = getServices();
      if (!services) return [];

      incrementCallCount();
      const sessionToken = ensureSessionToken();
      const googleMaps = window.google?.maps;

      return runWithRetry(
        () =>
          new Promise<PlacesPrediction[]>((resolve, reject) => {
            services.autocompleteService.getPlacePredictions(
              {
                input,
                types,
                componentRestrictions: { country },
                sessionToken: sessionToken ?? undefined,
                location: locationBias && googleMaps
                  ? new googleMaps.LatLng(locationBias.lat, locationBias.lng)
                  : undefined,
                radius: locationBias ? radius : undefined,
              },
              (predictions, status) => {
                if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK) {
                  resolve(predictions ?? []);
                  return;
                }
                if (status === window.google?.maps?.places?.PlacesServiceStatus?.ZERO_RESULTS) {
                  resolve([]);
                  return;
                }
                if (status === window.google?.maps?.places?.PlacesServiceStatus?.OVER_QUERY_LIMIT) {
                  setError("Batas Google Places tercapai. Beralih ke mode manual.");
                  setManualModeState(true);
                }
                reject(new Error(status));
              }
            );
          })
      ).catch(() => {
        setError("Pencarian alamat gagal. Silakan input manual.");
        setManualModeState(true);
        return [];
      });
    },
    [
      apiCallCount,
      country,
      ensureSessionToken,
      getServices,
      incrementCallCount,
      isReady,
      manualMode,
      runWithRetry,
      setManualModeState,
    ]
  );

  const getPlaceDetails = useCallback(
    async (placeId: string) => {
      if (manualMode) return null;
      if (!isReady) return null;
      if (!window.google?.maps?.places) return null;

      if (apiCallCount >= MAX_CALLS_PER_SESSION) {
        setManualModeState(true);
        return null;
      }

      const services = getServices();
      if (!services) return null;

      incrementCallCount();
      const sessionToken = ensureSessionToken();

      return runWithRetry(
        () =>
          new Promise<PlaceDetails | null>((resolve, reject) => {
            services.placesService.getDetails(
              {
                placeId,
                fields: ["address_components", "geometry", "place_id", "formatted_address"],
                sessionToken: sessionToken ?? undefined,
              },
              (place, status) => {
                if (status === window.google?.maps?.places?.PlacesServiceStatus?.OK) {
                  resolve(place);
                  return;
                }
                if (status === window.google?.maps?.places?.PlacesServiceStatus?.OVER_QUERY_LIMIT) {
                  setError("Batas Google Places tercapai. Beralih ke mode manual.");
                  setManualModeState(true);
                }
                reject(new Error(status));
              }
            );
          })
      ).catch(() => {
        setError("Detail alamat gagal dimuat. Silakan input manual.");
        setManualModeState(true);
        return null;
      });
    },
    [
      apiCallCount,
      ensureSessionToken,
      getServices,
      incrementCallCount,
      isReady,
      manualMode,
      runWithRetry,
      setManualModeState,
    ]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    isReady,
    error,
    manualMode,
    apiCallCount,
    setManualMode: setManualModeState,
    clearError,
    getPredictions,
    getPlaceDetails,
    resetSessionToken,
  };
}
