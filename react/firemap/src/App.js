// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import MapPage from './MapPage';
import FileManagerPage from './FileManagerPage';
import ProtectedRoute from './ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/file-manager"
          element={<ProtectedRoute element={FileManagerPage} />} // Use the ProtectedRoute component
        />
      </Routes>
    </Router>
  );
};

export default App;