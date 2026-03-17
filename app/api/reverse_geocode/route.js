import { NextResponse } from "next/server";
import { buildDisplayLocation, formatCoordinatePair, reverseGeocode } from "@/lib/geocode";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("long"));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "lat and long query params are required" }, { status: 400 });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "lat/long are out of range" }, { status: 400 });
    }

    const geocoded = await reverseGeocode(latitude, longitude);
    const coordinatePair = formatCoordinatePair(latitude, longitude);

    return NextResponse.json({
      latitude,
      longitude,
      coordinatePair,
      address: geocoded.address,
      locationText: buildDisplayLocation(coordinatePair, geocoded.address),
      error: geocoded.error,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reverse geocode", details: error.message },
      { status: 500 }
    );
  }
}
