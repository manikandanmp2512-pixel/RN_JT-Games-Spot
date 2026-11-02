import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

/* -------------------------------------------------------------------------- */
/* API URL                                                                    */
/* -------------------------------------------------------------------------- */

// Local backend (works when your phone and computer are on the same network).
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  // "http://192.168.31.214:5000";
  "https://jaytech-backend-4.onrender.com";

const API_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL.replace(/\/+$/, "")}/api`;

/* -------------------------------------------------------------------------- */
/* Axios Instance                                                             */
/* -------------------------------------------------------------------------- */

const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    Accept: "application/json",
  },
});

/* -------------------------------------------------------------------------- */
/* Authentication Interceptor                                                */
/* -------------------------------------------------------------------------- */

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------------------------- */
/* API Error Message                                                          */
/* This is the missing export causing your import error.                      */
/* -------------------------------------------------------------------------- */

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    if (!error.response) {
      return "Cannot connect to the backend. Check your API URL and internet connection.";
    }

    if (error.response.status === 401) {
      return "Session expired. Please log in again.";
    }

    if (error.response.status === 404) {
      return "API endpoint not found. Check your backend route.";
    }

    if (error.response.status >= 500) {
      return "Server error. Please check your backend.";
    }

    return error.message || "Request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

/* -------------------------------------------------------------------------- */
/* Chess API                                                                  */
/* -------------------------------------------------------------------------- */

export const getChessPresence = async () =>
  (await api.get("/chess/presence")).data;

export const getFriends = async () =>
  (await api.get("/chess/friends")).data;

export const getFriendRequests = async () =>
  (await api.get("/chess/friend-requests")).data;

/* -------------------------------------------------------------------------- */
/* Profile Photo Upload                                                       */
/* -------------------------------------------------------------------------- */

export const uploadProfilePhoto = async (uri: string) => {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const fileName =
    uri.split("/").pop() || `profile-${Date.now()}.jpg`;

  const extension = fileName.split(".").pop()?.toLowerCase();

  let mimeType = "image/jpeg";

  if (extension === "png") {
    mimeType = "image/png";
  } else if (extension === "webp") {
    mimeType = "image/webp";
  }

  const formData = new FormData();

  formData.append(
    "file",
    {
      uri,
      name: fileName,
      type: mimeType,
    } as any
  );

  const response = await fetch(`${API_URL}/user/uploadFiles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data?.message || "Profile photo upload failed"
    );
  }

  return data;
};

/* -------------------------------------------------------------------------- */
/* Default Axios Export                                                       */
/* Required by chessRewardApi.ts                                              */
/* -------------------------------------------------------------------------- */

export default api;