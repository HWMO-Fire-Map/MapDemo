import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Button, Drawer, AppBar, Toolbar, Typography, Select, MenuItem, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
    <div>
      {/* Header */}
      <AppBar position="static" style={{ backgroundColor: '#1D6069' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            HWMO Fire Data
          </Typography>
          <Button variant="contained" style={{ backgroundColor: '#fff', color: '#1D6069' }}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Container for Collapse Sidebar Button */}
      <IconButton
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        sx={{
          borderTopRightRadius: sidebarCollapsed ? '10px' : '10px',
          position: 'absolute',
          zIndex: 2,
          marginTop: '105px',
          marginLeft: sidebarCollapsed ? '0px' : '300px',
          transition: 'margin 0.5s ease-in-out',
          backgroundColor: '#1D6069', // Set button background color
          color: '#ffffff', // Set button text color
        }}
      >
        {sidebarCollapsed ? <ArrowForwardIcon /> : <ArrowBackIcon />}
      </IconButton>
      {/* Map and Sidebar */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={!sidebarCollapsed}
          PaperProps={{
            sx: {
              width: '300px',
              backgroundColor: 'rgba(0, 183, 219, 1)',
              borderTopRightRadius: '10px',
              borderBottomRightRadius: '10px',
            },
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h6">
                <Button onClick={() => setYearDropdownVisible(!yearDropdownVisible)}>
                  Toggle Year Range
                </Button>
              </Typography>
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
              <Typography variant="h6">
                <Button onClick={() => setMonthDropdownVisible(!monthDropdownVisible)}>
                  Toggle Month Range
                </Button>
              </Typography>
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
          <Typography variant="h6">Select Island:</Typography>
          <Select value={selectedIsland} onChange={(e) => setSelectedIsland(e.target.value)}>
            {uniqueIslands.map(island => (
              <MenuItem key={island} value={island}>
                {island}
              </MenuItem>
            ))}
          </Select>
          <Button onClick={fetchData}>Fetch Data</Button>
          <Button onClick={handleDownload}>Download Map</Button>
        </Drawer>

        {/* Map */}
        <div style={{ 
          flex: 1, 
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '20px',
          paddingBottom: '20px',
        
        }}>
          {mapHtmlUrl && (
            <MapContainer style={{ height: '80vh', width: '100%' }}>
              <iframe title="Folium Map" src={mapHtmlUrl} width="100%" height="100%" frameBorder="0" />
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
