import axiosClient from "./axiosClient";

export const signup = (payload) => {
  return axiosClient.post("auth/signup", payload);
};

export const login = (payload) => {
  return axiosClient.post("auth/login", payload);
};

export const forgotPassword = (payload) => {
  return axiosClient.post("auth/forgot-password", payload);
};

export const resetPassword = (payload) => {
  return axiosClient.post("auth/reset-password", payload);
};

export const getMe = () => {
  return axiosClient.get("auth/me");
};

export const logout = () => {
  return axiosClient.post("auth/logout");
};
