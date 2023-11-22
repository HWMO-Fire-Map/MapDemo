import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  Checkbox,
  colors,
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DownloadIcon from '@mui/icons-material/Download';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAlert from '@mui/material/Alert';
import { Stack } from '@mui/system';
import { pink } from '@mui/material/colors';
import './App.css'; // Import the CSS file

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const fetchData = async (
  selectedYears,
  selectedMonths,
  selectedIsland,
  setOpenGood,
  setMapHtmlUrl,
  setOpenSuccess,
  setOpenError,
  setReloadKey,
  savedID,
  savedDataSet
) => {
  savedID = localStorage.getItem('id');
  savedDataSet = localStorage.getItem('data_set');
  setOpenGood(true);
  try {
    const response = await axios.get('http://localhost:5000/api/data', {
      params: {
        years: selectedYears.join(','),
        months: selectedMonths.join(','),
        islands: selectedIsland.join(','),
        id_num: savedID,
        dataSet: savedDataSet,
      },
    });
    const {mapHtml} =
      response.data;
    localStorage.setItem('user_map', JSON.stringify(mapHtml));
    console.log(mapHtml);
    setOpenGood(false);
    setOpenSuccess(true);
    await axios.get('http://localhost:5000/api/moveData', {
      params: {
        id_num: savedID,
      },
    });
    console.log('forcing update');
    setMapHtmlUrl(mapHtml);
    setReloadKey(prevKey => prevKey + 1);
    

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
  const [mapHtmlUrl, setMapHtmlUrl] = useState('/default_map.html');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGood, setOpenGood] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [uniqueDataSets, setUniqueDataSets] = React.useState([]);
  const [selectedDataSet, setSelectedDataSet] = React.useState([]);
  
  /* set defaults if needed */
  const yearsList = useMemo(() => {
    const startYear = 2010;
    const endYear = 2022;
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  }, []);

  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ], []);

  const islands = useMemo(() => [
    'Tinian', 'Saipan', 'Rota', 'Guam', 'Palau', 'Yap',
  ], []);


  useEffect(() => {
    console.log('Get request sent');

    const savedSelectedYears = localStorage.getItem('selectedYears');
    const savedSelectedMonths = localStorage.getItem('selectedMonths');
    const savedSelectedIsland = localStorage.getItem('selectedIsland');
    const savedFileLocation = localStorage.getItem('user_map');
    const savedID = localStorage.getItem('id');
    const savedDataSet = localStorage.getItem('data_set');

    if (savedSelectedYears) {
      setSelectedYears(JSON.parse(savedSelectedYears));
    }
    if (savedSelectedMonths) {
      setSelectedMonths(JSON.parse(savedSelectedMonths));
    }
    if (savedSelectedIsland) {
      setSelectedIsland(JSON.parse(savedSelectedIsland));
    }
    if (savedFileLocation) {
      setMapHtmlUrl(JSON.parse(savedFileLocation));
    }
    if (savedDataSet) {
      setSelectedDataSet(JSON.parse(savedDataSet));
    }
    Promise.all([
      axios.get('http://localhost:5000/api/list', {
        params: {
          dataSet: savedDataSet
        }
      }),
      axios.get('http://localhost:5000/api/existing', {
        params: {
          param1: savedID,
        },
      })
    ])
      .then((responses) => {
        const [response1, response2] = responses;
        const { allYears, allIslands, allMonths, allDataSets } = response1.data;
        const { id_num } = response2.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setUniqueMonths(allMonths);
        setUniqueDataSets(allDataSets);
        localStorage.setItem('id', id_num);
      })
      .catch((error) => {
        console.error('Error fetching default data:', error);
      });
  }, []);

  // Update selected items and save to localStorage when checkboxes are changed
  const handleCheckboxChange = (value, type) => {
    let updatedSelection = [];
    switch (type) {
      case 'year':
        updatedSelection = selectedYears.includes(value)
          ? selectedYears.filter((year) => year !== value)
          : [...selectedYears, value];
        setSelectedYears(updatedSelection);
        localStorage.setItem('selectedYears', JSON.stringify(updatedSelection));
        break;
      case 'month':
        updatedSelection = selectedMonths.includes(value)
          ? selectedMonths.filter((month) => month !== value)
          : [...selectedMonths, value];
        setSelectedMonths(updatedSelection);
        localStorage.setItem('selectedMonths', JSON.stringify(updatedSelection));
        break;
      case 'island':
        updatedSelection = selectedIsland.includes(value)
          ? selectedIsland.filter((island) => island !== value)
          : [...selectedIsland, value];
        setSelectedIsland(updatedSelection);
        localStorage.setItem('selectedIsland', JSON.stringify(updatedSelection));
        break;
      default:
        break;
    }
  };

  const handleChangeDataSet = async (event) => {
    const value = event.target.value;
    setSelectedDataSet(value);
    localStorage.setItem('data_set', JSON.stringify(value));
    const savedDataSet = localStorage.getItem('data_set');
  
    try {
      const response = await axios.get('http://localhost:5000/api/list', {
        params: {
          dataSet: savedDataSet, // Use the updated value from the event
        },
      });
  
      const { allYears, allIslands, allMonths } = response.data;
      setUniqueYears(allYears);
      setUniqueIslands(allIslands);
      setUniqueMonths(allMonths);

    } catch (error) {
      // Handle errors if the request fails
      console.error('Error fetching data:', error);
    }
  };

  const clearYearSelection = () => {
    setSelectedYears([]);
    localStorage.setItem('selectedYears', JSON.stringify([]));
  };

  const clearMonthSelection = () => {
    setSelectedMonths([]);
    localStorage.setItem('selectedMonths', JSON.stringify([]));
  };



  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenError(false);
    setOpenSuccess(false);
    console.log('handleClose');
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
      console.log('Setting up download link');
  };

const handleGenerateMap = () => {
  fetchData(
    selectedYears,
    selectedMonths,
    selectedIsland,
    setOpenGood,
    setMapHtmlUrl,
    setOpenSuccess,
    setOpenError,
    setReloadKey,
  );
};

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        style={{ backgroundColor: '#1D6069'}}
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
          <Typography variant="h6" component="div" sx={{color: '#ffffff', paddingRight:'20px'}}>
            HWMO Fire Data
          </Typography>
        <Button variant="text">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            Data Download Information
          </Typography>
        </Button>
        </Toolbar>
      </AppBar>

      <Drawer
          variant="persistent"
          anchor="left"
          open={!sidebarCollapsed}
          PaperProps={{
            sx: {
              width: '300px',
              marginTop: '80px',
              backgroundColor: 'rgba(0, 183, 219, 1)',
              borderTopRightRadius: '10px',
              borderBottomRightRadius: '10px',
              maxHeight: '85vh'
            },
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px' }}>
            <div>
              <Typography variant="h6" color='#523700'>
                  Select Year
              </Typography>
                <IconButton
                  variant="contained"
                  onClick={clearYearSelection}
                  size='small'
                  sx={{ fontSize: '14px' }} // Adjust the font size here
                >
                  <ClearAllIcon/>
                  clear year
                </IconButton>
                <div>
                  {uniqueYears.map((year) => (
                    <label key={year} style={{ display: 'block' }}>
                      <input
                        type="checkbox"
                        value={year}
                        checked={selectedYears.includes(year)}
                        onChange={() => handleCheckboxChange(year, 'year')}
                      />
                      {year}
                    </label>
                  ))}
                </div>
            </div>
            <div>
              <Typography variant="h6" color='#523700'>
                  Select Month
              </Typography>
              <IconButton
                  variant="contained"
                  onClick={clearMonthSelection}
                  size='small'
                  sx={{ fontSize: '14px' }} // Adjust the font size here
                >
                  <ClearAllIcon/>
                  clear months
                </IconButton>
              <div>
                {uniqueMonths
                  .filter((month) => month !== null && month !== undefined)
                  .map((month) => (
                    <label key={month} style={{ display: 'block' }}>
                      <input
                        type="checkbox"
                        value={month}
                        checked={selectedMonths.includes(month)}
                        onChange={() => handleCheckboxChange(month, 'month')}
                      />
                      {month}
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
          <Typography variant="h6" color='#523700'>Select Islands</Typography>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '20px' }}>
            {uniqueIslands
              .filter((island) => island !== null && island !== undefined)
              .map((island) => (
                <div key={island}>
                  <Checkbox
                    size="small"
                    sx={{
                      color: pink[800],
                      '&.Mui-checked': {
                        color: pink[600],
                      },
                    }}
                    value={island}
                    checked={selectedIsland.includes(island)}
                    onChange={() => handleCheckboxChange(island, 'island')}
                  />
                  <span>{island}</span>
                </div>
              ))}
          </div>
          <FormControl 
            sx={{
              color: '#c70049', 
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { 
                borderColor: '#0208bd' 
                } 
              }}
            >
            <InputLabel id="DataSet-select-label" sx={{}}>DataSet </InputLabel>
            <Select
            labelId="DataSet-select-label"
            value={selectedDataSet}
            label="DataSet"
            onChange={handleChangeDataSet}
            sx={{}}>
            {uniqueDataSets.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
            </Select>
          </FormControl>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '15vh',
            justifyContent: 'center', // Center vertically
            alignItems: 'center', // Center horizontally 
          }}>
          <Stack spacing={4} style={{ marginTop: 'auto' }}>
            <Button
              size="large"
              color="secondary"
              component="label"
              variant="contained"
              startIcon={<LocalFireDepartmentIcon />}
              onClick={handleGenerateMap}
              sx={{ width: '200px' }} // Adjust the width as needed
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
              sx={{ width: '200px' }} // Adjust the width as needed
            >
              Download Map
            </Button>
          </Stack>
          </div>

          <Snackbar open={openGood}>
            <Alert severity="info" sx={{ width: '100%' }}>
              Map Generating
            </Alert>
          </Snackbar>

          <Snackbar open={openError} autoHideDuration={2000} onClose={handleClose}>
            <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
              Map failed to generate
            </Alert>
          </Snackbar>

          <Snackbar open={openSuccess} autoHideDuration={2000} onClose={handleClose}>
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
            <iframe 
              title="Folium Map" 
              src={`${mapHtmlUrl}?key=${reloadKey}`}
              width="100%" 
              height="100%" 
              frameBorder="0" />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default App;
