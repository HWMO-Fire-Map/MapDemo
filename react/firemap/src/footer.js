import React from 'react';
import Typography from "@mui/material/Typography";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1D6069', padding: '10px', textAlign: 'center', position: 'fixed', bottom: '0', width: '100%' }}>
<Typography variant="body2" style={{ color: 'white' }}>
  &copy; {new Date().getFullYear()} | This project was funded by
  <a href="https://www.fs.usda.gov/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}> USDA Forest Service </a> and implemented by 
  <a href="https://www.hawaiiwildfire.org/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}> Hawaii Wildfire Management Organization </a> in partnership with the 
  <a href="https://thehetf.us/ipif/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}> Institute of Pacific Islands Forestry </a>
</Typography>

    </footer>
  );
};

export default Footer;