import { io } from "socket.io-client";
const socket = io("http://localhost:7171");
export default socket;
