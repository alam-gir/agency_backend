import mongoose, { Schema } from "mongoose";

interface IEmailVarificationCode extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  code: number;
  expires: Date;
}

const emailVarificationModel = new Schema<IEmailVarificationCode>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    code: { type: Number, required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

export const EmailVarificationCodeModel =
  mongoose.model<IEmailVarificationCode>(
    "EmailVarificationCode",
    emailVarificationModel
  );
