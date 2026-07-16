import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
  },
  reducers: {
    addNotification: (state, action) => {
      state.list = [action.payload, ...state.list];
    },
    setNotifications: (state, action) => {
      state.list = action.payload;
    },
    clearNotifications: (state) => {
      state.list = [];
    },
  },
});

export const { addNotification, setNotifications, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
