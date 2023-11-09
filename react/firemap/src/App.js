import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('');

  // Fetch default data when the component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/api/list')
      .then(response => {
        const { allYears, allIslands } = response.data;
        setUniqueYears(allYears);
        setUniqueIslands(allIslands);
        setSelectedYear(allYears[0]); // Set default selected year
        setSelectedIsland(allIslands[0]); // Set default selected island
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  // Function to fetch data based on selected year and island
  const fetchData = () => {
    axios.get('http://localhost:5000/api/data', {
      params: {
        years: selectedYear,
        islands: selectedIsland
      }
    })
    .then(response => {
      const { uniqueYears, uniqueIslands } = response.data;
      setUniqueYears(uniqueYears);
      setUniqueIslands(uniqueIslands);
    })
    .catch(error => {
      console.error(error);
    });
  };

  return (
    <div>
      {/* Dropdown for selecting year */}
      <div>
        <label>Select Year:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {uniqueYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
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
