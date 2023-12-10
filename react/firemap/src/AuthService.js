import axios from 'axios';

export const login = async (email, password) => {
  try {
    console.log("sending password:", password, "and username:", email)
    const response = await axios.post('http://127.0.0.1:5000/login/auth', {
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
