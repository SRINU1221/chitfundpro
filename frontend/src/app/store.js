import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import chitReducer from '../features/chits/chitSlice';
// import auctionReducer from '../features/auctions/auctionSlice';
import paymentReducer from '../features/payments/paymentSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chits: chitReducer,
        // auctions: auctionReducer,
        payment: paymentReducer,
    },
});
