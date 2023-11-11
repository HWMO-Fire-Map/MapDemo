import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css'; // Import the CSS file

const App = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState('');
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapHtmlUrl, setMapHtmlUrl] = useState('/filtered_map.html');
  const [yearDropdownVisible, setYearDropdownVisible] = useState(true);
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch default data when the component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/api/list')
      .then(response => {
        const { allYears, allIslands, allMonths } = response.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setUniqueMonths(allMonths);
        setSelectedIsland(allIslands[0]); // Set default selected island
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  // Function to fetch data based on selected years and island
  const fetchData = () => {
    axios.get('http://localhost:5000/api/data', {
      params: {
        years: selectedYears.join(','), // Send the selected years as a comma-separated string
        months: selectedMonths.join(','), // Send the selected years as a comma-separated string
        islands: selectedIsland
      }
    })
    .then(response => {
      const { geojsonData, uniqueYears, uniqueIslands } = response.data;
      console.log('GeoJSON Data:', geojsonData); // Log GeoJSON data to the console
      setGeojsonData(geojsonData);
      setUniqueYears(uniqueYears);
      setUniqueMonths(uniqueMonths);
      setUniqueIslands(uniqueIslands);
    })
    .catch(error => {
      console.error(error);
    });
  };

  const handleDownload = async () => {
    try {
      // Fetch the HTML content from mapHtmlUrl
      const response = await axios.get(mapHtmlUrl);
  
      // Create a Blob containing the HTML content
      const blob = new Blob([response.data], { type: 'text/html' });
  
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'HWMO_filtered_map.html';
  
      // Append the link to the document and trigger the click event
      document.body.appendChild(link);
      link.click();
  
      // Remove the link from the document
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading map:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Container for Collapse Sidebar Button */}
      <div style={{ 
        alignSelf: 'flex-start', 
        marginTop: '20px',
        marginBottom: '0px',
        marginRight: '0px',
        marginLeft: '0px',
        padding: '0px'
      }}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? '->' : '<-'}
        </button>
      </div>

      {/* Map and Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div style={{ 
            width: '300px',
            marginTop: '0px',
            marginBottom: '20px',
            padding: '20px', 
            overflow: 'hidden', 
            transition: 'width s', 
            backgroundColor: 'rgba(29, 96, 105, 0.8)', // RGB color with 0.8 (80%) alpha
            borderTopRightRadius: '10px', // Round the top-right corner
            borderBottomRightRadius: '10px', // Round the bottom-right corner
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h2>
                  <button onClick={() => setYearDropdownVisible(!yearDropdownVisible)}>
                    Toggle Year Range
                  </button>
                </h2>
                {yearDropdownVisible && (
                  <div>
                    {uniqueYears.map(year => (
                      <label key={year} style={{ display: 'block' }}>
                        <input
                          type="checkbox"
                          value={year}
                          checked={selectedYears.includes(year)}
                          onChange={() => {
                            const newSelectedYears = selectedYears.includes(year)
                              ? selectedYears.filter(selectedYear => selectedYear !== year)
                              : [...selectedYears, year];
                            setSelectedYears(newSelectedYears);
                          }}
                        />
                        {year}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h2>
                  <button onClick={() => setMonthDropdownVisible(!monthDropdownVisible)}>
                    Toggle Month Range
                  </button>
                </h2>
                {monthDropdownVisible && (
                  <div>
                    {uniqueMonths.map(month => (
                      <label key={month} style={{ display: 'block' }}>
                        <input
                          type="checkbox"
                          value={month}
                          checked={selectedMonths.includes(month)}
                          onChange={() => {
                            const newSelectedMonths = selectedMonths.includes(month)
                              ? selectedMonths.filter(selectedMonth => selectedMonth !== month)
                              : [...selectedMonths, month];
                            setSelectedMonths(newSelectedMonths);
                          }}
                        />
                        {month}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <h2>Select Island:</h2>
            <div>
            <select value={selectedIsland} onChange={(e) => setSelectedIsland(e.target.value)}>
              {uniqueIslands.map(island => (
                <option key={island} value={island}>{island}</option>
              ))}
            </select>
            </div>
            <button onClick={fetchData}>Fetch Data</button>
            <button onClick={handleDownload}>Download Map</button>
            
          </div>
        )}

        {/* Map */}
        <div style={{ 
          flex: 1, 
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '0px',
          paddingBottom: '20px'
        
        }}>
          {mapHtmlUrl && (
            <MapContainer style={{ height: '90vh', width: '100%' }}>
              <iframe title="Folium Map" src={mapHtmlUrl} width="100%" height="100%" frameBorder="0" />
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
