import { getAuthToken } from "@/utils/authStorage";
import axios from "axios";

export const API_ROOT = "http://192.168.31.214:5000";
// export const API_ROOT = "http://172.27.170.226:5000";

// For Render, use:
// export const API_ROOT = "https://jaytech-backend-4.onrender.com";

export const API_URL = `${API_ROOT}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// ============================================================
// AUTH TOKEN
// ============================================================

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// REGISTER
// ============================================================

export const registerUser = async (data: {
  fname: string;
  lname: string;
  email: string;
  countryCode: string;
  mobilenumber: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
};

// ============================================================
// VERIFY REGISTER OTPs
// ============================================================

export const verifyRegisterOtp = async (data: {
  email: string;
  emailOtp: string;
  mobileOtp: string;
}) => {
  const response = await api.post(
    "/auth/verify-register-otp",
    data
  );

  return response.data;
};

// ============================================================
// LOGIN
// ============================================================

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post(
    "/auth/login",
    data
  );

  return response.data;
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

export const sendForgotOtp = async (
  email: string
) => {
  const response = await api.post(
    "/auth/forgot-password",
    {
      email,
    }
  );

  return response.data;
};

// ============================================================
// VERIFY FORGOT OTP
// ============================================================

export const verifyForgotOtp = async (
  email: string,
  otp: string
) => {
  const response = await api.post(
    "/auth/verify-forgot-otp",
    {
      email,
      otp,
    }
  );

  return response.data;
};

// ============================================================
// RESET PASSWORD
// ============================================================

export const resetPassword = async (
  email: string,
  password: string
) => {
  const response = await api.post(
    "/auth/reset-password",
    {
      email,
      password,
    }
  );

  return response.data;
};

export default api;