import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserResponse } from '../types/auth.types';

interface UserState {
  details: UserResponse | null;
  isAuthenticated: boolean;
}

// Try to load user from sessionStorage (for page refreshes)
const loadUserFromStorage = (): UserResponse | null => {
  try {
    const userData = sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const initialState: UserState = {
  details: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
};

const userSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserResponse>) => {
      state.details = action.payload;
      state.isAuthenticated = true;
      // Persist user to sessionStorage (not tokens!)
      sessionStorage.setItem('user', JSON.stringify(action.payload));
    },
    clearUser: (state) => {
      state.details = null;
      state.isAuthenticated = false;
      sessionStorage.removeItem('user');
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;