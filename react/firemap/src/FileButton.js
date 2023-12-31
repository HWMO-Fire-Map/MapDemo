import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useHistory from react-router-dom

const FileButton = () => {
  const history = useNavigate();

  const handleRedirectToLogin = () => {
    history('/file-manager'); // Redirects to '/login' route
  };

  return (
    <Button sx={{ color: '#d65ef7 !important' }} onClick={handleRedirectToLogin}>
      File Manager
    </Button>
  );
};

export default FileButton;