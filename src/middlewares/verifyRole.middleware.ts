import { NextFunction, Response } from "express"
import { IGetUserInterfaceRequst } from "../../@types/custom"
import { UserModel } from "../models/user.model";

const verifyRole = (role: "user" | "admin" | "super-admin") => {
    return async (req: IGetUserInterfaceRequst, res : Response, next : NextFunction) => {
        const JWTUser = req.user;
        try {
            const user = await UserModel.findById(JWTUser!._id).select("-password");
            if(user?.role !== role) return res.status(403).json({message: `This route is only for ${role}. Access denied!`});
            next();
        } catch (error) {
            return res.status(500).json({message: "Internal server error from verify role section."});
        }
    }
}

export {
    verifyRole
}