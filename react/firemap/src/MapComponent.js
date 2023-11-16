import React from 'react';
import { MapContainer } from 'react-leaflet';

const CustomMapContainer = ({ mapHtmlUrl }) => {
  return (
    <div
      style={{
        flex: 1,
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '20px',
        paddingBottom: '20px',
        marginTop: '80px',
      }}
    >
      {mapHtmlUrl && (
        <MapContainer style={{ height: '85vh', width: '100%' }}>
          <iframe title="Folium Map" src={mapHtmlUrl} width="100%" height="100%" frameBorder="0" />
        </MapContainer>
      )}
    </div>
  );
};

export default CustomMapContainer;
