import express from "express";  
import { logout,login,signup,getTeachers, getStudents, sendOtp} from "../controllers/authControllers.js";
import protect from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/login",login)
router.post("/logout",protect,logout)
router.post("/signup",signup) 
router.post("/send-otp",protect, sendOtp);

router.get("/",getTeachers)
router.get("/getStudent",getStudents)

 export default router;   