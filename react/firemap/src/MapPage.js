import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Tabs,
  Tab,
  Container
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DownloadIcon from '@mui/icons-material/Download';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAlert from '@mui/material/Alert';
import { Stack } from '@mui/system';
import { pink } from '@mui/material/colors';
import './App.css'; // Import the CSS file
import LoginForm from './LoginComponent';
import FileButton from './FileButton'; 

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const fetchData = async (
  selectedYears,
  selectedMonths,
  selectedIsland,
  setOpenGood,
  setMapHtmlUrl,
  setGeojsonData,
  setOpenSuccess,
  setOpenError,
  savedID,
  savedDataSet,
) => {
  savedID = localStorage.getItem('id');
  savedDataSet = localStorage.getItem('data_set');
  setOpenGood(true);
  try {
    const response = await axios.get('http://127.0.0.1:5000/api/data', {
      params: {
        years: selectedYears.join(','),
        months: selectedMonths.join(','),
        islands: selectedIsland.join(','),
        id_num: savedID,
        dataSet: savedDataSet,
      },
    });
    const {mapHtml, map_data} =
      response.data;
    localStorage.setItem('user_map', JSON.stringify(mapHtml));
    console.log(mapHtml);
    setOpenGood(false);
    setOpenSuccess(true);
    setGeojsonData(map_data);
    console.log('updating map');
    setMapHtmlUrl(mapHtml);
    

  } catch (error) {
    setOpenError(true);
    setOpenGood(false);
    console.error('Error fetching data:', error);
  }
};

const MapPage = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState([]);
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapHtmlUrl, setMapHtmlUrl] = useState('/39_filtered_map.html');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGood, setOpenGood] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [uniqueDataSets, setUniqueDataSets] = React.useState([]);
  const [selectedDataSet, setSelectedDataSet] = React.useState([]);
  const [currentTab, setCurrentTab] = useState(0);

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
      axios.get('http://127.0.0.1:5000/api/list', {
        params: {
          dataSet: savedDataSet
        }
      }),
      axios.get('http://127.0.0.1:5000/api/existing', {
        params: {
          param1: savedID,
        },
      })
    ])
      .then((responses) => {
        const [response1, response2] = responses;
        const { allYears, allIslands, allMonths, allDataSets } = response1.data;
        const { id_num, map_data } = response2.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setUniqueMonths(allMonths);
        setUniqueDataSets(allDataSets);
        setGeojsonData(map_data);
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
      const response = await axios.get('http://127.0.0.1:5000/api/list', {
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    console.log(newValue)
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

  const handleHTMLDownload = async () => {
    try {      
      const cached_map = geojsonData
      const blob = new Blob([cached_map], { type: 'text/html' });

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

const handleSHPDownload = async () => {
  try {
    const savedID = localStorage.getItem('id').toString();
    const mapZipApiUrl = `http://127.0.0.1:5000/api/mapZip?id_num=${savedID}`;

    const response = await axios.get(mapZipApiUrl);
    const base64EncodedZip = response.data.shape_zip;

    // Decode base64-encoded ZIP file to binary data
    const zipData = atob(base64EncodedZip);
    const arrayBuffer = new ArrayBuffer(zipData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < zipData.length; i++) {
      uint8Array[i] = zipData.charCodeAt(i);
    }

    // Create Blob from binary data
    const blob = new Blob([uint8Array], { type: 'application/zip' });

    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'HWMO_Map_Data.zip';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Downloaded map")
  } catch (error) {
    console.error('Error downloading map:', error);
  }
};

const handleGenerateMap = () => {
  fetchData(
    selectedYears,
    selectedMonths,
    selectedIsland,
    setOpenGood,
    setMapHtmlUrl,
    setGeojsonData,
    setOpenSuccess,
    setOpenError,
  );
};

  return (
    <div>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} style={{ backgroundColor: '#1D6069' }}>
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
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab label="HWMO Fire Data" sx={{ color: '#fca41e' }}/>
            <Tab label="Data Downloads" sx={{ color: '#00c735' }}/>
          </Tabs>
          <FileButton />
          <LoginForm />
        </Toolbar>
      </AppBar>
      {currentTab === 0 && (
        <div>
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
                paddingLeft: '10px',
                paddingRight: '10px', 
                '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { 
                  borderColor: '#0208bd' 
                  } 
                }}
              >
              <InputLabel id="DataSet-select-label" sx={{paddingLeft: '10px'}}>DataSet </InputLabel>
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
              justifyContent: 'center', // Center vertically
              alignItems: 'center', // Center horizontally
              marginTop: '20px'
            }}>
            <Stack spacing={4} style={{ alignItems: 'center'}}>
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
                onClick={handleHTMLDownload}
                fullWidth
                sx={{ fontSize: '12px' }}
              >
                Download Map (HTML)
              </Button>

              <Button
                size="large"
                color="success"
                component="label"
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleSHPDownload}
                fullWidth
                sx={{ fontSize: '12px' }}
              >
                Download Map (SHP)
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
          id="mapContainer"
          style={{ 
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: '20px',
            paddingBottom: '20px',
            marginTop: '80px',
          }}
        >
          <iframe
            id="mapIframe"
            style={{height: '85vh' }}
            title="Folium Map"
            srcDoc={geojsonData}
            width="100%"
            height="100%"
            frameBorder="0"
            />
        </div>
        </div>
      )}
        {currentTab === 1 && (
        <Container maxWidth="md">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', paddingTop: '20px', background: '#68b6ed', height: '85vh'}}>
          <Container maxWidth="md">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h3" component="div" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#02002e'}}>
                HWMO Fire Data
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#02002e'}}>
                Information on Western Micronesia: which include the islands of Guam, Rota, Saipan, Tinian, and Yap<br />
                <br />
                Abstract:<br />
                This data publication contains vector polygon spatial data showing burn areas from wildfires
                in 2016-2021 on Guam, Yap State (Federated States of Micronesia-FSM), and the Commonwealth of
                Northern Marianas Islands-CNMI (Saipan, Tinian, and Rota Islands). Burn areas from wildfire in
                2015 are also provided for Guam.<br />
              </Typography>
              <Typography variant="h6" sx={{ display: 'flex', color: '#02002e'}}>
                <li>
                  <a href="https://www.fs.usda.gov/rds/archive/catalog/RDS-2023-0012">
                    https://www.fs.usda.gov/rds/archive/catalog/RDS-2023-0012
                  </a>
                </li>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#02002e'}}>
              <br />Information on Babeldaob Island wildfires<br />
              <br />
              Abstract:<br />
              This data publication contains wildfire locations as well as areas of repeated wildfires on Babeldaob Island, Palau from 2012 to 2021. These data were digitized from a variety of sources: handheld global positioning system (GPS) fire perimeter mapping, aerial photo fire perimeter mapping, and satellite image fire perimeter mapping. In addition to 1) wildfire locations and 2) the areas of repeated wildfires, also included for Babeldaob Island are: 3) streams composed from topographic maps, 4) roads (obtained from Palau Automated Land and Resource Information Service (PALARIS) and updated with 2015 imagery), 5) locations of terrestrial protected areas, 6) mangrove vegetation around the island, 7) Babeldaob Island state boundaries, and 8) Babeldaob coastline.
              </Typography>
              <Typography variant="h6" sx={{ display: 'flex', color: '#02002e'}}>
                <li>
                  <a href="https://www.fs.usda.gov/rds/archive/catalog/RDS-2022-0039">
                  https://www.fs.usda.gov/rds/archive/catalog/RDS-2022-0039
                  </a>
                </li>
              </Typography>
            </Grid>
          </Grid>
          </Container>
      </div>
      </Container>
      )}
    </div>
  );
};

export default MapPage;
