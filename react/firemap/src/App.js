import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [uniqueYears, setUniqueYears] = useState([]);
  const [uniqueIslands, setUniqueIslands] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/data')
      .then(response => {
        const { uniqueYears, uniqueIslands } = response.data;
        setUniqueYears(uniqueYears);
        setUniqueIslands(uniqueIslands);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Unique Years:</h1>
      <ul>
        {uniqueYears.map(year => (
          <li key={year}>{year}</li>
        ))}
      </ul>
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