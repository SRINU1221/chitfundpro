import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from './paymentService';

const initialState = {
    transactions: [],
    chitTransactions: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Record payment
export const recordPayment = createAsyncThunk(
    'payments/record',
    async (paymentData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paymentService.recordPayment(paymentData, token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get my transactions
export const getMyTransactions = createAsyncThunk(
    'payments/getMy',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paymentService.getMyTransactions(token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get chit transactions
export const getChitTransactions = createAsyncThunk(
    'payments/getChit',
    async (chitId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paymentService.getChitTransactions(chitId, token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(recordPayment.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(recordPayment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.transactions.unshift(action.payload);
            })
            .addCase(recordPayment.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getMyTransactions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMyTransactions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.transactions = action.payload;
            })
            .addCase(getMyTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getChitTransactions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getChitTransactions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.chitTransactions = action.payload;
            })
            .addCase(getChitTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = paymentSlice.actions;
export default paymentSlice.reducer;
