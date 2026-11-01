import api from "../Api/axios";

// Fetch all users
const getAllUsers = async (params) => {
  const response = await api.get("/users", {
    params,
  });

  return response.data;
};

// Fetch single user
const getSingleUser = async (id) => {
  const response = await api.get(`/users/${id}`);

  return response.data;
};

// Update User
const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

const userService = {
  getAllUsers,
  getSingleUser,
  updateUser
};

export default userService;