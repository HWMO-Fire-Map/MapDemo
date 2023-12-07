import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage'; // Import your login page component
import MapPage from './MapPage'; // Import your main app page component
import FileManagerPage from './FileManagerPage'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/file-manager" element={<FileManagerPage />} />
      </Routes>
    </Router>
  );
};

export default App;