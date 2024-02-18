import mongoose, { Schema } from "mongoose";
import { IUser } from "./user.model";

interface IAccount extends mongoose.Document {
  userId: mongoose.Types.ObjectId | IUser;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

const accountSchema = new Schema<IAccount>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  providerAccountId: { type: String, required: true },
  refresh_token: { type: String },
  access_token: { type: String },
  expires_at: { type: Number },
  token_type: { type: String },
  scope: { type: String },
  id_token: { type: String },
});


export const AccountModel = mongoose.model<IAccount> ("Account", accountSchema)