import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import {
  Button,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAlert from '@mui/material/Alert';
import { Stack } from '@mui/system';
import './App.css'; // Import the CSS file

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const fetchData = async (
  selectedYears,
  selectedMonths,
  selectedIsland,
  setGeojsonData,
  setUniqueYears,
  setUniqueMonths,
  setUniqueIslands,
  setOpenGood,
  setOpenSuccess,
  setOpenError
) => {
  try {
    setOpenGood(true);
    const response = await axios.get('http://localhost:5000/api/data', {
      params: {
        years: selectedYears.join(','),
        months: selectedMonths.join(','),
        islands: selectedIsland.join(','),
      },
    });

    const { geojsonData, uniqueYears, uniqueIslands, uniqueMonths } =
      response.data;
    setGeojsonData(geojsonData);
    setUniqueYears(uniqueYears);
    setUniqueMonths(uniqueMonths);
    setUniqueIslands(uniqueIslands);
    setOpenGood(false);
    setOpenSuccess(true);
  } catch (error) {
    setOpenError(true);
    setOpenGood(false);
    console.error('Error fetching data:', error);
  }
};

const App = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState([]);
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapHtmlUrl, setMapHtmlUrl] = useState('/filtered_map.html');
  const [yearDropdownVisible, setYearDropdownVisible] = useState(true);
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGood, setOpenGood] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);

  useEffect(() => {
    console.log('Get request sent');
    axios
      .get('http://localhost:5000/api/list')
      .then((response) => {
        const { allYears, allIslands, allMonths } = response.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setUniqueMonths(allMonths);
      })
      .catch((error) => {
        console.error('Error fetching default data:', error);
      });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenError(false);
    setOpenSuccess(false);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(mapHtmlUrl);
      const blob = new Blob([response.data], { type: 'text/html' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'HWMO_filtered_map.html';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading map:', error);
    }
  };

const handleGenerateMap = () => {
  fetchData(
    selectedYears,
    selectedMonths,
    selectedIsland,
    setGeojsonData,
    setUniqueYears,
    setUniqueMonths,
    setUniqueIslands,
    setOpenGood,
    setOpenSuccess,
    setOpenError
  );
};

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        style={{ backgroundColor: '#1D6069' }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            HWMO Fire Data
          </Typography>
          <Button variant="contained" style={{ backgroundColor: '#fff', color: '#1D6069' }}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      <IconButton
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        sx={{
          borderTopRightRadius: sidebarCollapsed ? '10px' : '40px',
          borderBottomRightRadius: sidebarCollapsed ? '10px' : '40px',
          borderTopLeftRadius: sidebarCollapsed ? '0px' : '0px',
          borderBottomLeftRadius: sidebarCollapsed ? '0px' : '0px',
          position: 'absolute',
          zIndex: 2,
          marginTop: '0px',
          marginLeft: sidebarCollapsed ? '0px' : '290px',
          transition: 'margin 0.5s ease-in-out',
          backgroundColor: sidebarCollapsed ? '#1D6069' : 'rgba(0, 183, 219, 1)',
          color: '#ffffff',
        }}
      >
        {sidebarCollapsed ? <ArrowForwardIcon /> : <ArrowBackIcon />}
      </IconButton>

      <Drawer
          variant="persistent"
          anchor="left"
          open={!sidebarCollapsed}
          PaperProps={{
            sx: {
              width: '300px',
              marginTop: '64px',
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
                  {uniqueYears.map((year) => (
                    <label key={year} style={{ display: 'block' }}>
                      <input
                        type="checkbox"
                        value={year}
                        checked={selectedYears.includes(year)}
                        onChange={() => {
                          const newSelectedYears = selectedYears.includes(year)
                            ? selectedYears.filter((selectedYear) => selectedYear !== year)
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
                  {uniqueMonths
                    .filter((month) => month !== null && month !== undefined)
                    .map((month) => (
                      <label key={month} style={{ display: 'block' }}>
                        <input
                          type="checkbox"
                          value={month}
                          checked={selectedMonths.includes(month)}
                          onChange={() => {
                            const newSelectedMonths = selectedMonths.includes(month)
                              ? selectedMonths.filter((selectedMonth) => selectedMonth !== month)
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
          <Select
            multiple
            value={selectedIsland}
            onChange={(e) => setSelectedIsland(e.target.value)}
          >
            {uniqueIslands.map((island) => (
              <MenuItem key={island} value={island}>
                {island}
              </MenuItem>
            ))}
          </Select>
          <Stack spacing={4}>
            <Button
              size="large"
              color="secondary"
              component="label"
              variant="contained"
              startIcon={<LocalFireDepartmentIcon />}
              onClick={handleGenerateMap}
            >
              Generate Map
            </Button>
            <Button
              size="large"
              color="success"
              component="label"
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download Map
            </Button>
          </Stack>

          <Snackbar open={openGood} autoHideDuration={6000} onClose={handleClose}>
            <Alert severity="info" sx={{ width: '100%' }}>
              Map Generating
            </Alert>
          </Snackbar>

          <Snackbar open={openError} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
              Map failed to generate
            </Alert>
          </Snackbar>

          <Snackbar open={openSuccess} autoHideDuration={6000} onClose={handleClose}>
            <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
              Map Generated
            </Alert>
          </Snackbar>
        </Drawer>

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
          <MapContainer style={{ height: '85vh', width: '100%'}}>
            <iframe title="Folium Map" src={mapHtmlUrl} width="100%" height="100%" frameBorder="0" />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default App;
