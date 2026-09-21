import { getCountries } from "@amplifiedhq/countries-atlas";

const countries = getCountries();

const coordsByName = new Map(
  countries.map((c) => [c.name, { lat: Number(c.latitude), lng: Number(c.longitude) }])
);

export function getCountryCoordinates(name: string | null | undefined): { lat: number; lng: number } | null {
  if (!name) return null;
  return coordsByName.get(name) || null;
}

export function getAllCountryNames(): string[] {
  return countries.map((c) => c.name);
}
