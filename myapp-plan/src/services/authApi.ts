import axios from "axios";

/*
 * This MUST be reachable from the Android device.
 *
 * Backend:
 * http://192.168.31.214:5000
 */
const API_URL = "http://192.168.31.214:5000";

// const API_URL = "https://jaytech-backend.onrender.com";

const authApi =
  axios.create({
    baseURL:
      `${API_URL}/api/auth`,

    timeout: 15000,

    headers: {
      "Content-Type":
        "application/json",

      Accept:
        "application/json",
    },
  });

/* =========================================================
   REGISTER
========================================================= */

export const registerUser =
  async (
    payload: {
      fname: string;
      lname: string;
      email: string;
      mobilenumber: string;
      countryCode?: string;
      password: string;
      confirmPassword: string;
    }
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/register",
          payload
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "Registration failed.",
      };
    }
  };

/* =========================================================
   REGISTER OTP
========================================================= */

export const verifyRegisterOtp =
  async (
    payload: {
      email: string;
      otp: string;
    }
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/verify-register-otp",
          payload
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "OTP verification failed.",
      };
    }
  };

/* =========================================================
   LOGIN
========================================================= */

export const loginUser =
  async (
    payload: {
      email: string;
      password: string;
    }
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/login",
          payload
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "Login failed.",
      };
    }
  };

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export const sendForgotPasswordOtp =
  async (
    email: string
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/forgot-password/send-otp",
          {
            email,
          }
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "Unable to send OTP.",
      };
    }
  };

export const verifyForgotPasswordOtp =
  async (
    email: string,
    otp: string
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/forgot-password/verify-otp",
          {
            email,
            otp,
          }
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "OTP verification failed.",
      };
    }
  };

export const resetPassword =
  async (
    email: string,
    password: string
  ) => {
    try {
      const { data } =
        await authApi.post(
          "/forgot-password/reset",
          {
            email,
            password,
          }
        );

      return data;
    } catch (e: any) {
      return {
        success: false,

        message:
          e?.response?.data
            ?.message ||
          "Password reset failed.",
      };
    }
  };