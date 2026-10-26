// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";

// const API_URL = "http://192.168.31.214:5000/api";
// // const API_URL = "http://172.27.170.226:5000/api";

// const api = axios.create({ baseURL: API_URL, timeout: 15000 });
// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export const getChessPresence = async () => (await api.get("/chess/presence")).data;
// export const getFriends = async () => (await api.get("/chess/friends")).data;
// export const getFriendRequests = async () => (await api.get("/chess/friend-requests")).data;

// export const uploadProfilePhoto = async ( uri: string ) => { const token = await AsyncStorage.getItem("token"); if (!token) { throw new Error( "Authentication token not found" ); } const fileName = uri.split("/").pop() || `profile-${Date.now()}.jpg`; const extension = fileName.split(".").pop()?.toLowerCase(); let mimeType = "image/jpeg"; if (extension === "png") { mimeType = "image/png"; } else if (extension === "webp") { mimeType = "image/webp"; } const formData = new FormData(); formData.append("file", { uri, name: fileName, type: mimeType, } as any); const response = await fetch( `${API_URL}/user/uploadFiles`, { method: "POST", headers: { Authorization: `Bearer ${token}`, }, body: formData, } ); const data = await response.json(); if (!response.ok || !data.success) { throw new Error( data?.message || "Profile photo upload failed" ); } return data; };


import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.31.214:5000/api";
// const API_URL = "http://172.27.170.226:5000/api";
// const API_URL = "https://jaytech-backend-4.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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