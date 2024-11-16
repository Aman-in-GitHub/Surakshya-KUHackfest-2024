type Coordinate = number[];

function isInDangerZones(
  userLocation: Coordinate,
  radiusKm: number,
  dangerPoints: Coordinate[]
): boolean {
  const [userLon, userLat] = userLocation;
  const R = 6371;

  return dangerPoints.some((dangerPoint) => {
    const [zoneLon, zoneLat] = dangerPoint;

    const dLat = ((zoneLat - userLat) * Math.PI) / 180;
    const dLon = ((zoneLon - userLon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((zoneLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  });
}

export default isInDangerZones;
