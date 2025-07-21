import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email:{
    type:String,
    required:true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  }, 
  contact:{
    type:String,
    minlength:10
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  role:{
    type:String,
    enum: ["student", "teacher"],
  },
  profilePic:{type:String }
});

const User = mongoose.model("User",userSchema);

export default  User;
