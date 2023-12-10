import React from 'react';
import Typography from "@mui/material/Typography";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1D6069', padding: '10px', textAlign: 'center', position: 'fixed', bottom: '0', width: '100%' }}>
    <Typography variant="body2" style={{ color: 'white' }}>
        &copy; {new Date().getFullYear()} Henry Blazier | <a href="https://hbzxc.github.io/" target="_blank" style={{ color: 'white' }}>https://hbzxc.github.io/</a>
      </Typography>
    </footer>
  );
};

export default Footer;