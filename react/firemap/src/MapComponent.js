import React from 'react';
import leaflet from 'leaflet';

const MapComponent = ({ geojsonData }) => {
  const mapElement = React.useRef(null);

  React.useEffect(() => {
    const map =leaflet.map(mapElement.current).setView([0, 0], 2);
    leaflet.GeoJson(geojsonData).addTo(map);
  }, [geojsonData]);

  return <div ref={mapElement} style={{ height: '500px' }} />;
};

export default MapComponent;
