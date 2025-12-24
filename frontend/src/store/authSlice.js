import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { login, signup, getMe } from '../api/auth.api';

/* ------------------ Async Thunks ------------------ */

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {
      const res = await login(email, password);
      localStorage.setItem('access_token', res.data.access_token);
      const me = await getMe();
      return me.data;
    } catch (err) {
      return thunkAPI.rejectWithValue('Invalid credentials');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ email, password }, thunkAPI) => {
    try {
      await signup(email, password);
      return thunkAPI.dispatch(loginUser({ email, password }));
    } catch {
      return thunkAPI.rejectWithValue('Signup failed');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/me',
  async (_, thunkAPI) => {
    try {
      const res = await getMe();
      return res.data;
    } catch {
      localStorage.removeItem('access_token');
      return thunkAPI.rejectWithValue();
    }
  }
);

/* ------------------ Slice ------------------ */

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,
    error: null,
  },
  reducers: {
    logout(state) {
      localStorage.removeItem('access_token');
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
