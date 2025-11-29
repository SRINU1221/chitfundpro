import axios from 'axios';

import API_URL from '../../config';

const PAYMENT_API_URL = API_URL + '/api/payments/';

// Record a payment
const recordPayment = async (paymentData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(PAYMENT_API_URL, paymentData, config);

    return response.data;
};

// Get my transactions
const getMyTransactions = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(PAYMENT_API_URL + 'my', config);

    return response.data;
};

// Get chit transactions (Organizer only)
const getChitTransactions = async (chitId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(PAYMENT_API_URL + 'chit/' + chitId, config);

    return response.data;
};

// Get organizer stats
const getOrganizerStats = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(PAYMENT_API_URL + 'organizer', config);

    return response.data;
};

const paymentService = {
    recordPayment,
    getMyTransactions,
    getChitTransactions,
    getOrganizerStats,
};

export default paymentService;
