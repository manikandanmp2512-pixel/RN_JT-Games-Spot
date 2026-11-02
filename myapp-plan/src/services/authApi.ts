import { getAuthToken } from "@/utils/authStorage";
import axios from "axios";

// ============================================================
// API CONFIGURATION
// ============================================================
// const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
//   "http://localhost:5000";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "https://jaytech-backend-4.onrender.com"
).replace(/\/+$/, "");

const API_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;
  
console.log("JAYTECH API URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================
// AUTHENTICATION INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();

      const isPublicAuthRequest =
        config.url?.startsWith("/auth/");

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

// ============================================================
// API ERROR MESSAGE
// ============================================================

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    if (!error.response) {
      return "Cannot connect to the backend. Check the API URL and server.";
    }

    return error.message || "Request failed.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
};

// ============================================================
// MOBILE AUTH DATA
// ============================================================

export type MobileAuthData = {
  countryCode: string;
  mobilenumber: string;
};

// ============================================================
// REGISTER
// ============================================================

export const registerUser = async (data: {
  fname: string;
  lname: string;
  countryCode: string;
  mobilenumber: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

// ============================================================
// VERIFY REGISTER OTP
// ============================================================

export const verifyRegisterOtp = async (
  data: MobileAuthData & { mobileOtp: string }
) => {
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
  countryCode: string;
  mobilenumber: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

// ============================================================
// FORGOT PASSWORD OTP
// ============================================================

export const sendForgotPasswordOtp = async (
  data: MobileAuthData
) => {
  const response = await api.post(
    "/auth/forgot-password",
    data
  );

  return response.data;
};

// ============================================================
// VERIFY FORGOT OTP
// ============================================================

export const verifyForgotOtp = async (
  data: MobileAuthData & { otp: string }
) => {
  const response = await api.post(
    "/auth/verify-forgot-otp",
    data
  );

  return response.data;
};

// ============================================================
// RESET PASSWORD
// ============================================================

export const resetPassword = async (
  data: MobileAuthData & { password: string }
) => {
  const response = await api.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};

export default api;