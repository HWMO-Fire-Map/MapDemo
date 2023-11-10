import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

const App = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);
  const [selectedDates, setSelectedDates] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [selectedIsland, setSelectedIsland] = useState('');
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapHtmlUrl, setMapHtmlUrl] = useState('/filtered_map.html');

  // Fetch default data when the component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/api/list')
      .then(response => {
        const { allYears, allIslands } = response.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setSelectedDates([
          {
            startDate: new Date(allYears[0], 0, 1),
            endDate: new Date(allYears[0], 11, 31),
            key: 'selection'
          }
        ]); // Set default selected date range for the first year
        setSelectedIsland(allIslands[0]); // Set default selected island
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  // Function to fetch data based on selected dates and island
  const fetchData = () => {
    const startDate = selectedDates[0].startDate;
    const endDate = selectedDates[0].endDate;
    axios.get('http://localhost:5000/api/data', {
      params: {
        years: `${startDate.getFullYear()}-${endDate.getFullYear()}`, // Send the selected year range
        islands: selectedIsland
      }
    })
    .then(response => {
      const { geojsonData, uniqueYears, uniqueIslands } = response.data;
      console.log('GeoJSON Data:', geojsonData); // Log GeoJSON data to the console
      setGeojsonData(geojsonData);
      setUniqueYears(uniqueYears);
      setUniqueIslands(uniqueIslands);
    })
    .catch(error => {
      console.error(error);
    });
  };

  return (
    <div>
      {/* Date range picker for selecting years */}
      <div>
        <label>Select Year Range:</label>
        <DateRangePicker
          ranges={selectedDates}
          onChange={item => setSelectedDates([item.selection])}
        />
      </div>
      {/* Dropdown for selecting island */}
      <div>
        <label>Select Island:</label>
        <select value={selectedIsland} onChange={(e) => setSelectedIsland(e.target.value)}>
          {uniqueIslands.map(island => (
            <option key={island} value={island}>{island}</option>
          ))}
        </select>
      </div>
      {/* Button to fetch data */}
      <button onClick={fetchData}>Fetch Data</button>

      {/* Leaflet Map */}
      {mapHtmlUrl && (
        <div style={{ height: '500px', width: '100%' }}>
          <iframe title="Folium Map" src={mapHtmlUrl} width="100%" height="100%" frameBorder="0" />
        </div>
      )}

      {/* Display unique years */}
      <h1>Unique Years:</h1>
      <ul>
        {uniqueYears.map(year => (
          <li key={year}>{year}</li>
        ))}
      </ul>
      {/* Display unique islands */}
      <h1>Unique Islands:</h1>
      <ul>
        {uniqueIslands.map(island => (
          <li key={island}>{island}</li>
        ))}
      </ul>
    </div>
  );
};

export default App;
