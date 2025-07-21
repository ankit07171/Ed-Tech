import express from "express";  
import { logout,login,signup,getTeachers, getStudents} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login",login)
router.post("/logout",logout)
router.post("/signup",signup) 

router.get("/",getTeachers)
router.get("/getStudent",getStudents)

 export default router;   