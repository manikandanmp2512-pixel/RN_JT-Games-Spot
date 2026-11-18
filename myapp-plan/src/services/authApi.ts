import { getAuthToken } from "@/utils/authStorage";
import axios from "axios";

// -----------------------------------------------------------------------------
// API CONFIG
// -----------------------------------------------------------------------------

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:5000";

// const API_BASE_URL = (
//   process.env.EXPO_PUBLIC_API_URL?.trim() ||
//   "https://jaytech-backend-4.onrender.com"
// ).replace(/\/+$/, "");

const API_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

// console.log("JAYTECH API URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// -----------------------------------------------------------------------------
// AUTH INTERCEPTOR
// -----------------------------------------------------------------------------

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      const isPublicAuthRequest = config.url?.startsWith("/auth/");

      if (token && !isPublicAuthRequest) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("AUTH TOKEN ERROR:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// -----------------------------------------------------------------------------
// ERROR HANDLER
// -----------------------------------------------------------------------------

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;

    if (!error.response) {
      return "Cannot connect to the backend. Check the API URL and server.";
    }

    return error.message || "Request failed.";
  }

  return error instanceof Error ? error.message : "Something went wrong.";
};

// -----------------------------------------------------------------------------
// REGISTRATION
// -----------------------------------------------------------------------------

export type RegisterData = {
  fname: string;
  lname: string;
  email: string;
  countryCode: string;
  mobilenumber: string;
  password: string;
  confirmPassword: string;
};

export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", {
    fname: data.fname.trim(),
    lname: data.lname.trim(),
    email: data.email.trim().toLowerCase(),
    countryCode: data.countryCode.trim() || "+91",
    mobilenumber: data.mobilenumber.trim(),
    password: data.password,
    confirmPassword: data.confirmPassword,
  });

  return response.data;
};

// Registration OTP: mobile number in international E.164 format
export const verifyRegisterOtp = async (data: {
  mobile: string;
  otp: string;
}) => {
  const response = await api.post("/auth/verify-register-otp", {
    mobile: data.mobile.trim(),
    otp: data.otp.trim(),
  });

  return response.data;
};

// -----------------------------------------------------------------------------
// LOGIN — UNCHANGED
// -----------------------------------------------------------------------------

export const loginUser = async (data: {
  mobilenumber: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", {
    mobilenumber: data.mobilenumber.replace(/\D/g, ""),
    password: data.password,
  });

  return response.data;
};

// -----------------------------------------------------------------------------
// FORGOT PASSWORD — MOBILE OTP
// -----------------------------------------------------------------------------

export const sendForgotPasswordOtp = async (data: {
  mobile: string;
}) => {
  const response = await api.post("/auth/forgot-password", {
    mobile: data.mobile.trim(),
  });

  return response.data;
};

export const verifyForgotOtp = async (data: {
  mobile: string;
  otp: string;
}) => {
  const response = await api.post("/auth/verify-forgot-otp", {
    mobile: data.mobile.trim(),
    otp: data.otp.trim(),
  });

  return response.data;
};

// -----------------------------------------------------------------------------
// RESET PASSWORD — AFTER MOBILE OTP VERIFICATION
// -----------------------------------------------------------------------------

export const resetPassword = async (data: {
  mobile: string;
  password: string;
}) => {
  const response = await api.post("/auth/reset-password", {
    mobile: data.mobile.trim(),
    password: data.password,
  });

  return response.data;
};

// -----------------------------------------------------------------------------
// DEFAULT EXPORT
// -----------------------------------------------------------------------------

export default api;
