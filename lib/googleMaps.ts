/**
 * Minimal Google Maps JS API loader — injects the script once (with the Places
 * library) and resolves with the global `google` object. Add your key to the
 * environment as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-exposed on purpose;
 * restrict it by HTTP referrer in the Google Cloud console).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
  }
}

let loader: Promise<any> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      loader = null; // allow a retry next time
      reject(new Error("Failed to load the Google Maps script"));
    };
    document.head.appendChild(script);
  });
  return loader;
}
