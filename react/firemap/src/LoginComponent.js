import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useHistory from react-router-dom

const LoginForm = () => {
  const history = useNavigate();

  const handleRedirectToLogin = () => {
    history('/login'); // Redirects to '/login' route
  };

  return (
    <Button sx={{ color: '#aec4f2 !important' }} onClick={handleRedirectToLogin}>
      Login
    </Button>
  );
};

export default LoginForm;