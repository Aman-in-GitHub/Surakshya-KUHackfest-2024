import { CONSTANTS } from '@/utils/CONSTANTS';

function getMapHtml(coords: number[], navigateTo: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
        <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
        <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
        </style>
      </head>

      <body>
        <div id="map"></div>
        <script src="https://cdn.jsdelivr.net/npm/@turf/turf@7/turf.min.js"></script>
        <script type="module">
          import maplibremaplibreGlDirections, {LoadingIndicatorControl} from 'https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-directions@0.7.1/+esm'

          const location = [${coords[0]}, ${coords[1]}];
          const dangerZones = ${JSON.stringify(CONSTANTS.DANGER_ZONES)};
          const warningZones = ${JSON.stringify(CONSTANTS.WARNING_ZONES)};

          async function init() {
            const map = new maplibregl.Map({
              container: 'map',
              style: 'https://tiles.openfreemap.org/styles/positron',
              center: location,
              zoom: 13,
              attributionControl: false
            });

            map.on('load', async () => {
              map.addControl(new maplibregl.NavigationControl());
              map.addControl(new maplibregl.GeolocateControl());

              const directions = new maplibremaplibreGlDirections(map);
              directions.on("fetchroutesend", (ev) => {
        let totalDistance = ev.data?.routes[0].distance;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TOTAL_DISTANCE", value: totalDistance }));
      });
              map.addControl(new LoadingIndicatorControl(directions));

              directions.setWaypoints([
                [${coords[0]}, ${coords[1]}],
                [${navigateTo[0]}, ${navigateTo[1]}],
              ]);


              const options = {
                steps: 64,
                units: 'kilometers'
              };

              dangerZones.forEach((zoneCoords, index) => {
                const dangerCircle = turf.circle(zoneCoords, ${
                  CONSTANTS.DANGER_ZONE_RANGE
                }, options);
                
                map.addSource(\`danger-zone-\${index}\`, {
                  type: 'geojson',
                  data: dangerCircle
                });

                map.addLayer({
                  id: \`danger-zone-\${index}\`,
                  type: 'fill',
                  source: \`danger-zone-\${index}\`,
                  paint: {
                    'fill-color': '#e64553',
                    'fill-opacity': 0.3
                  }
                });

                map.addLayer({
                  id: \`danger-zone-outline-\${index}\`,
                  type: 'line',
                  source: \`danger-zone-\${index}\`,
                  paint: {
                    'line-color': '#e64553',
                    'line-width': 3
                  }
                });
              });

              warningZones.forEach((zoneCoords, index) => {
                const warningCircle = turf.circle(zoneCoords, ${
                  CONSTANTS.WARNING_ZONE_RANGE
                }, options);
                
                map.addSource(\`warning-zone-\${index}\`, {
                  type: 'geojson',
                  data: warningCircle
                });

                map.addLayer({
                  id: \`warning-zone-\${index}\`,
                  type: 'fill',
                  source: \`warning-zone-\${index}\`,
                  paint: {
                    'fill-color': '#fab387',
                    'fill-opacity': 0.3
                  }
                });

                map.addLayer({
                  id: \`warning-zone-outline-\${index}\`,
                  type: 'line',
                  source: \`warning-zone-\${index}\`,
                  paint: {
                    'line-color': '#fab387',
                    'line-width': 3
                  }
                });
              });

              const homeImage = await map.loadImage('https://img.icons8.com/?size=100&id=80319&format=png&color=000000');
              if (homeImage) {
                map.addImage('homeIcon', homeImage.data);
              }

              map.addSource('point', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [${CONSTANTS.HOME_COORDS[0]}, ${
    CONSTANTS.HOME_COORDS[1]
  }]
                      }
                    }
                  ]
                }
              });

              map.addLayer({
                id: 'points',
                type: 'symbol',
                source: 'point',
                layout: {
                  'icon-image': 'homeIcon',
                  'icon-size': 0.5
                }
              });
            });
          }

          init();
        </script>
      </body>
    </html>
    `;
}

export default getMapHtml;
