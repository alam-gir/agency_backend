import { UserModel } from "../../models/user.model";

export const findUserById = async (id: string) => {
  return await UserModel.findOne({ _id: id });
};
export const findUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email: email });
};
export const findUserByName = async (name: string) => {
  return await UserModel.findOne({ name: name });
};
export const findUserByRefreshToken = async (refreshToken: string) => {
  return await UserModel.findOne({ refreshToken: refreshToken });
};

export const createUser = async ({
  name,
  email,
  avatar,
  password,
  provider,
}: {
  name: string;
  email: string;
  avatar?: string;
  password?: string;
  provider?: boolean;
}) => {
  if (provider) {
    return await UserModel.create({
      name,
      email,
      avatar,
      emailVarified: new Date()
    });
  } else {
    return await UserModel.create({
      name,
      email,
      password,
    });
  }
};
