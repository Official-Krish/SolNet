import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Token expired"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  },
);
