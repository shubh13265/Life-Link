interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) *
    Math.cos(coord2.latitude * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get nearby coordinates within a radius
 */
export const getNearbyCoordinates = (
  lat: number,
  lon: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } => {
  const latChange = radiusKm / 111.32; // 1 degree latitude = ~111.32 km
  const lonChange = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latChange,
    maxLat: lat + latChange,
    minLon: lon - lonChange,
    maxLon: lon + lonChange,
  };
};
