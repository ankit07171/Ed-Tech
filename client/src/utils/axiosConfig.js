import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:7171",  
  withCredentials: true,  
});

export default instance;
