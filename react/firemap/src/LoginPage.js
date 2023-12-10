import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './AuthService';
import LoginForm from './LoginComponent';
import FileButton from './FileButton';
import MainButton from './MainButton';
import Footer from './footer';

import { AppBar, Toolbar } from '@mui/material';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(''); // New state for login error message
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await login(email, password);
      navigate('/file-manager');
    } catch (error) {
      console.error('Login failed', error);
      if (error.message === 'Incorrect password') { // Check for specific error message
        setLoginError('Incorrect password. Please try again.');
      } else {
        setLoginError('Login failed. Please try again.'); // Generic error message
      }
    }
  };

  return (
    <div>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} style={{ backgroundColor: '#1D6069' }}>
        <Toolbar sx={{ display: 'flex', marginLeft: '60px', justifyContent: 'space-between' }}>
          <MainButton />
          <div style={{ display: 'flex' }}>
            <FileButton />
          </div>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            boxShadow: 3,
            borderRadius: 2,
            px: 4,
            py: 6,
            marginTop: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'white',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign In To Access File Manager
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="User Name"
              name="username"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
             <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            {loginError && (
              <Typography variant="body2" color="error">
                {loginError}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
      <Footer/>
    </div>
  );
}