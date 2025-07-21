import mongoose from 'mongoose';

const mongoConnect = async()=>{
    try {
        mongoose.connect(process.env.MONGODB_URI)
        console.log("Databse conneced succesfully ...");
        
    } catch (error) {
        console.error("Error in database connection",error);
        
    }
}
export default mongoConnect;