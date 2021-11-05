import { createSlice } from '@reduxjs/toolkit';

interface UserState {
  roleId: number,
  roleName: string,
  userId: number,
  userName: string,
  schoolId: number
};

const initialState: UserState = {
  roleId: 0,
  roleName: '',
  userId: 0,
  userName: '',
  schoolId: 0
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      return {
        ...state,
        ...action.payload
      };
    },
  }
});

export const { setUserInfo } = userSlice.actions;

export default userSlice.reducer;
