import mongoose from "mongoose"

const DB_URI = process.env.MONDODB_URI; 

export const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI as string)
           } catch (error) {
            throw new Error("database connection failed");

    }
}