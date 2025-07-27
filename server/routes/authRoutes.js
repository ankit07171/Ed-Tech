import express from "express";  
import { logout,login,signup,getTeachers, getStudents, sendOtp} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login",login)
router.post("/logout",logout)
router.post("/signup",signup) 
router.post("/send-otp", sendOtp);

router.get("/",getTeachers)
router.get("/getStudent",getStudents)

 export default router;   