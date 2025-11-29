import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chitService from './chitService';

const initialState = {
    chits: [],
    chit: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Create new chit
export const createChit = createAsyncThunk(
    'chits/create',
    async (chitData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.createChit(chitData, token);
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

// Get user chits
export const getChits = createAsyncThunk(
    'chits/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.getChits(token);
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

// Get single chit
export const getChit = createAsyncThunk(
    'chits/get',
    async (chitId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.getChit(chitId, token);
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

// Join chit
export const joinChit = createAsyncThunk(
    'chits/join',
    async (chitId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.joinChit(chitId, token);
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

// Update member status
export const updateMemberStatus = createAsyncThunk(
    'chits/updateMemberStatus',
    async ({ chitId, userId, status }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.updateMemberStatus(chitId, userId, status, token);
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

// Start chit
export const startChit = createAsyncThunk(
    'chits/start',
    async (chitId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await chitService.startChit(chitId, token);
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

export const chitSlice = createSlice({
    name: 'chit',
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
            .addCase(createChit.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createChit.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.chits.push(action.payload);
            })
            .addCase(createChit.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getChits.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getChits.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.chits = action.payload;
            })
            .addCase(getChits.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getChit.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getChit.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.chit = action.payload;
            })
            .addCase(getChit.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(joinChit.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Update the chit in the list
                const index = state.chits.findIndex(chit => chit._id === action.payload._id);
                if (index !== -1) {
                    state.chits[index] = action.payload;
                }
            })
            .addCase(updateMemberStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Update the chit in the list
                const index = state.chits.findIndex(chit => chit._id === action.payload._id);
                if (index !== -1) {
                    state.chits[index] = action.payload;
                }
            })
            .addCase(startChit.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.chit = action.payload;
            });
    },
});

export const { reset } = chitSlice.actions;
export default chitSlice.reducer;
