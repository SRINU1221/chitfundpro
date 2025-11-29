import axios from 'axios';

import API_URL from '../../config';

const CHIT_API_URL = API_URL + '/api/chits/';

// Create new chit
const createChit = async (chitData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(CHIT_API_URL, chitData, config);

    return response.data;
};

// Get user chits
const getChits = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(CHIT_API_URL, config);

    return response.data;
};

// Get single chit
const getChit = async (chitId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(CHIT_API_URL + chitId, config);

    return response.data;
};

// Join chit
const joinChit = async (chitId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(CHIT_API_URL + chitId + '/join', {}, config);

    return response.data;
};

// Update member status
const updateMemberStatus = async (chitId, userId, status, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(
        CHIT_API_URL + `${chitId}/members/${userId}`,
        { status },
        config
    );

    return response.data;
};

// Start chit
const startChit = async (chitId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(CHIT_API_URL + `${chitId}/start`, {}, config);

    return response.data;
};

// Update chit
const updateChit = async (chitId, chitData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(CHIT_API_URL + chitId, chitData, config);

    return response.data;
};

// Delete chit
const deleteChit = async (chitId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(CHIT_API_URL + chitId, config);

    return response.data;
};

// Remove member
const removeMember = async (chitId, userId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(CHIT_API_URL + `${chitId}/members/${userId}`, config);

    return response.data;
};

const chitService = {
    createChit,
    getChits,
    getChit,
    joinChit,
    updateMemberStatus,
    startChit,
    updateChit,
    deleteChit,
    removeMember,
};

export default chitService;
