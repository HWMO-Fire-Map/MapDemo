import React from 'react';

const FoliumMapTest = () => {
  return (
    <div>
      <iframe
        title="Folium Map"
        width="100%"
        height="600"
        srcDoc={`
          <!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
              <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.js"></script>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.css"/>
            </head>
            <body>
              <div class="folium-map" id="map"></div>
              <script>
                var map = L.map('map').setView([51.505, -0.09], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(map);
              </script>
            </body>
          </html>
        `}
        frameBorder="0"
        scrolling="no"
      ></iframe>
    </div>
  );
};

export default FoliumMapTest;
