import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const checkTokenValidity = async () => {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) {
        setIsValidatingToken(false);
        setIsValidToken(false);
        return;
      }

      try {
        const response = await axios.get('/protected', {
          headers: {
            Authorization: jwtToken,
          },
        });

        if (response.status === 200) {
          setIsValidatingToken(false);
          setIsValidToken(true);
        }
      } catch (error) {
        setIsValidatingToken(false);
        setIsValidToken(false);
        console.error('Token validation failed:', error);
      }
    };

    checkTokenValidity();
  }, []);

  if (isValidatingToken) {
    // Return a loading indicator or placeholder until validation completes
    return <div>Loading...</div>;
  }

  return isValidToken ? <Component {...rest} /> : <Navigate to="/login" />;
};

export default ProtectedRoute;