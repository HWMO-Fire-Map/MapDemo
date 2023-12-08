import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useHistory from react-router-dom

const MainButton = () => {
  const history = useNavigate();

  const handleRedirectToLogin = () => {
    history('/'); // Redirects to '/' route
  };

  return (
    <Button sx={{ color: '#fca41e !important' }} onClick={handleRedirectToLogin}>
      HWMO Fire Data
    </Button>
  );
};

export default MainButton;