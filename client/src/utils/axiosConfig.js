import axios from "axios";

const instance = axios.create({
  baseURL: "https://ed-tech-44mp.onrender.com",  
  withCredentials: true,  
});

export default instance;
