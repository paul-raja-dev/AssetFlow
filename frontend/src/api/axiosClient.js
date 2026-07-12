import axios from "axios";

const prodBaseURL = "https://assetflow-production-20a8.up.railway.app/api/";
const localBaseURL = "http://localhost:8002/api/";

// Read from env but ensure it has a trailing slash if specified
let defaultURL = import.meta.env.VITE_API_BASE_URL || prodBaseURL;
if (!import.meta.env.VITE_API_BASE_URL) {
  defaultURL = localBaseURL;
}
if (defaultURL && !defaultURL.endsWith("/")) {
  defaultURL += "/";
}

const axiosClient = axios.create({
  baseURL: defaultURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Detect connection/network failure or timeout
    const isNetworkError =
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      error.code === "ECONNABORTED";

    // Verify if we are currently pointing to production
    const isProd = axiosClient.defaults.baseURL.includes("assetflow-production-20a8.up.railway.app");

    if (isNetworkError && isProd && originalRequest && !originalRequest._retryLocal) {
      originalRequest._retryLocal = true;
      
      console.warn(
        "Production backend unreachable. Dynamically switching base URL to local instance at http://localhost:8002/api/..."
      );
      
      // Update defaults for future requests
      axiosClient.defaults.baseURL = localBaseURL;
      
      // Update current request configuration and retry
      originalRequest.baseURL = localBaseURL;
      
      try {
        const retryResponse = await axiosClient(originalRequest);
        return retryResponse;
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Normalize to { code, message, details } — backend errors arrive as
    // { success:false, message, error:{ code, details } }.
    const body = error.response?.data;
    const errBody = body
      ? {
          code: body.error?.code || "HTTP_ERROR",
          message: body.message || "Request failed",
          details: body.error?.details || {},
        }
      : { code: "NETWORK_ERROR", message: error.message, details: {} };
    return Promise.reject(errBody);
  }
);

export default axiosClient;
