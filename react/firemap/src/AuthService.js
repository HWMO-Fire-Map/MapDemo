import axios from 'axios';

// Determine if the code is running in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set the base URL accordingly
const baseURL = isDevelopment ? 'http://127.0.0.1:5000' : '';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${baseURL}/login/auth`, {
      auth: {
        username: email,
        password: password,
      },
    });

    if (response.status === 200) {
      const data = response.data;
      localStorage.setItem('jwtToken', data.token);
      return data;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    throw new Error('Login failed'); // Here, you can pass the error message returned from the backend
  }
};

export const logout = () => {
  localStorage.removeItem('jwtToken');
};
