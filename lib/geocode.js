function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCoordinates(rawLocation) {
  if (!rawLocation || typeof rawLocation !== "string") {
    return null;
  }

  const match = rawLocation.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const latitude = toNumber(match[1]);
  const longitude = toNumber(match[2]);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function formatCoordinatePair(latitude, longitude) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocode(latitude, longitude) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  const query = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
  });

  const contactEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SMTP_USER || "support@example.com";
  const userAgent = `WorkManagement/1.0 (${contactEmail})`;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { address: null, error: `Geocoding failed with status ${response.status}` };
    }

    const payload = await response.json();
    const address = payload?.display_name?.trim() || null;

    return {
      address,
      payload,
      error: address ? null : "Address not found",
    };
  } catch (error) {
    return { address: null, error: error?.message || "Reverse geocoding failed" };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildDisplayLocation(locationText, resolvedAddress) {
  if (!resolvedAddress) {
    return locationText || "";
  }

  const coords = parseCoordinates(locationText);
  if (!coords) {
    return resolvedAddress;
  }

  return `${resolvedAddress} (${formatCoordinatePair(coords.latitude, coords.longitude)})`;
}
