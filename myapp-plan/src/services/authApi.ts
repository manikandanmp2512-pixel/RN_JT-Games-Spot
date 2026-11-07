import { getAuthToken } from "@/utils/authStorage";
import axios from "axios";

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

export const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
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
});

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

export type MobileAuthData = {
  countryCode: string;
  mobilenumber: string;
};

export type RegisterData = MobileAuthData & {
  fname: string;
  lname: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// REGISTER — GMAIL OTP
export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", {
    ...data,
    fname: data.fname.trim(),
    lname: data.lname.trim(),
    email: data.email.trim().toLowerCase(),
    countryCode: data.countryCode.trim() || "+91",
    mobilenumber: data.mobilenumber.trim(),
  });

  return response.data;
};

// VERIFY REGISTRATION GMAIL OTP
export const verifyRegisterOtp = async (data: {
  email: string;
  emailOtp: string;
}) => {
  const response = await api.post("/auth/verify-register-otp", {
    email: data.email.trim().toLowerCase(),
    emailOtp: data.emailOtp.trim(),
  });

  return response.data;
};

// LOGIN — MOBILE NUMBER + PASSWORD
export const loginUser = async (data: {
  mobilenumber: string;
  password: string;
}) => {
  const response = await api.post("/auth/login", {
    mobilenumber: data.mobilenumber.trim(),
    password: data.password,
  });

  return response.data;
};

// FORGOT PASSWORD — SEND GMAIL OTP
export const sendForgotPasswordOtp = async (data: {
  email: string;
}) => {
  const response = await api.post("/auth/forgot-password", {
    email: data.email.trim().toLowerCase(),
  });

  return response.data;
};

// FORGOT PASSWORD — VERIFY GMAIL OTP
export const verifyForgotOtp = async (data: {
  email: string;
  emailOtp: string;
}) => {
  const response = await api.post("/auth/verify-forgot-otp", {
    email: data.email.trim().toLowerCase(),
    emailOtp: data.emailOtp.trim(),
  });

  return response.data;
};

// RESET PASSWORD
export const resetPassword = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post("/auth/reset-password", {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });

  return response.data;
};

export default api;