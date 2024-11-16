type Coordinates = [number, number];
type MapBounds = [Coordinates, Coordinates];

type BoundsCheckResultType = {
  isWithinBounds: boolean;
  distance: number | null;
  message: string;
};

function isValidCoordinates(coords: unknown): coords is Coordinates {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    coords[0] >= -180 &&
    coords[0] <= 180 &&
    coords[1] >= -90 &&
    coords[1] <= 90
  );
}

function isValidBounds(bounds: unknown): bounds is MapBounds {
  if (!Array.isArray(bounds) || bounds.length !== 2) return false;
  return isValidCoordinates(bounds[0]) && isValidCoordinates(bounds[1]);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function findNearestPointOnBounds(
  point: Coordinates,
  bounds: MapBounds
): Coordinates {
  const [[west, south], [east, north]] = bounds;
  const [lon, lat] = point;

  const nearestLon = Math.max(west, Math.min(east, lon));
  const nearestLat = Math.max(south, Math.min(north, lat));

  return [nearestLon, nearestLat];
}

function checkWithinMapBounds(
  coordinates: unknown,
  mapBounds: unknown
): BoundsCheckResultType {
  if (!isValidCoordinates(coordinates)) {
    throw new Error('Invalid coordinates provided');
  }

  if (!isValidBounds(mapBounds)) {
    throw new Error('Invalid bounds provided');
  }

  const [[west, south], [east, north]] = mapBounds;
  const [lon, lat] = coordinates;

  const isWithinBounds =
    lon >= west && lon <= east && lat >= south && lat <= north;

  if (isWithinBounds) {
    return {
      isWithinBounds: true,
      distance: null,
      message: 'You are within the downloaded map range'
    };
  }

  const nearestPoint = findNearestPointOnBounds(coordinates, mapBounds);
  const distance = calculateDistance(coordinates, nearestPoint);

  return {
    isWithinBounds: false,
    distance,
    message: `You are ${distance.toFixed(2)}km outside the downloaded map range`
  };
}

export default checkWithinMapBounds;
