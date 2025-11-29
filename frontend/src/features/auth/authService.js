import axios from 'axios';

import API_URL from '../../config';

const AUTH_API_URL = API_URL + '/api/auth/';

// Register user
const register = async (userData) => {
    const response = await axios.post(AUTH_API_URL + 'signup', userData);

    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

// Login user
const login = async (userData) => {
    const response = await axios.post(AUTH_API_URL + 'login', userData);

    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

// Logout user
const logout = () => {
    localStorage.removeItem('user');
};

const authService = {
    register,
    logout,
    login,
};

export default authService;
