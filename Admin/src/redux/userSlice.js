import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userService from "../services/userService";

//Get ALL Users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params, thunkAPI) => {
    try {
      return await userService.getAllUsers(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// GET SINGLE USER
export const fetchSingleUser = createAsyncThunk(
  "users/fetchSingleUser",
  async (id, thunkAPI) => {
    try {
      return await userService.getSingleUser(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);

// UPDATE USER
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, userData }, thunkAPI) => {
    try {
      return await userService.updateUser(id, userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update user"
      );
    }
  }
);

const initialState = {
  users: [],
  selectedUser : null,
  pagination : {
    totalUsers : 0,
    currentPage : 1,
    totalPages : 0,
    limit : 10,
  },
  loading: false,
  error: null,
  success: false,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserSuccess: (state) => {
      state.success = false;
    },
    clearSelectedUser : (state)=>{
      state.selectedUser = null;
    }
  },
  extraReducers : (builder) => {
    builder
    .addCase(fetchUsers.pending, (state)=>{
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchUsers.fulfilled, (state,action)=>{
      state.loading = false;
      state.users = action.payload.data;
      state.pagination = action.payload.pagination;
    })
    .addCase(fetchUsers.rejected, (state, action)=>{
      state.loading = false;
      state.error = action.payload;
    })

    //Get single user
    .addCase(fetchSingleUser.pending, (state)=>{
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchSingleUser.fulfilled, (state,action)=>{
      state.loading = false;
      state.selectedUser = action.payload.data;
    })
    .addCase(fetchSingleUser.rejected, (state,action)=>{
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(updateUser.pending, (state) => {
  state.loading = true;
  state.error = null;
  state.success = false;
})

.addCase(updateUser.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  // Update user in Redux users array
  const updatedUser = action.payload.data;

  state.users = state.users.map((user) =>
    user._id === updatedUser._id
      ? { ...user, ...updatedUser }
      : user
  );

  // Update selected user if it is the same user
  if (state.selectedUser?._id === updatedUser._id) {
    state.selectedUser = {
      ...state.selectedUser,
      ...updatedUser,
    };
  }
})

.addCase(updateUser.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
  state.success = false;
});
  }
});

export const { clearUserError, clearUserSuccess, clearSelectedUser} = userSlice.actions;

export default userSlice.reducer;