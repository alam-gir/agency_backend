import { UserModel } from "../../models/user.model"

export const findUserById = async (id: string) => {
    return await UserModel.findOne({_id: id})
}
export const findUserByEmail = async (email: string) => {
    return await UserModel.findOne({email: email})
}
export const findUserByName = async (name: string) => {
    return await UserModel.findOne({name: name})
}
export const findUserByRefreshToken = async (refreshToken: string) => {
    return await UserModel.findOne({refreshToken: refreshToken})
}
