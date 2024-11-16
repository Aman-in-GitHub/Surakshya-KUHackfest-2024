import POLICE_STATIONS from '@/assets/stations.json';

async function checkReportData(data: any[]) {
  if (data.length === 0) {
    console.error('No reports found');
    return;
  }

  let stations: any[] = [];

  POLICE_STATIONS.features.forEach((feature) => {
    if (!feature.properties.name || feature.geometry.coordinates.length === 0) {
      return;
    }

    let firstCoord;

    if (feature.geometry.type === 'Point') {
      firstCoord = feature.geometry.coordinates;
    } else if (feature.geometry.type === 'Polygon') {
      // @ts-expect-error ERROR: My type error
      firstCoord = feature.geometry.coordinates[0][0];
    }

    stations.push(firstCoord);
  });

  data.map((report) => {
    let totalScore = 0;

    if (report.type === 'sexual_assault' || report.type === 'physical_threat') {
      totalScore += 2;
    } else {
      totalScore += 1;
    }

    const currentTime = new Date();
    let hourNow = currentTime.getHours();
    const startHour = 20;
    const endHour = 6;

    hourNow >= startHour || hourNow < endHour ? (totalScore += 2) : null;

    const nearestStation = 3000;
    if (nearestStation >= 3000) {
      totalScore += 2;
    } else if (nearestStation >= 1000) {
      totalScore += 1;
    }

    const trafficState = 'low';

    if (trafficState === 'low') {
      totalScore += 1;
    }

    const numberOfCrimesLastMonth = 2;
    const numberOfCrimesLastYear = 8;

    if (numberOfCrimesLastMonth > 2 || numberOfCrimesLastYear <= 6) {
      totalScore += 1;
    } else if (numberOfCrimesLastMonth > 4 || numberOfCrimesLastYear > 6) {
      totalScore += 3;
    }

    if (totalScore > 5 && totalScore < 7) {
      console.log('Warning Location');
    } else if (totalScore >= 8) {
      console.log('Danger Location');
    }
  });
}

export default checkReportData;
