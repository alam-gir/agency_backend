import mongoose, { Document, Schema } from "mongoose";

export interface IPackage extends Document {
  basic: mongoose.Types.ObjectId;
  standard: mongoose.Types.ObjectId;
  premium: mongoose.Types.ObjectId;
}

const packageSchema = new Schema<IPackage>({
  basic: {
    type: Schema.Types.ObjectId,
    ref: "packageOption"
  },
  standard: {
    type: Schema.Types.ObjectId,
    ref: "packageOption"
  },
  premium: {
    type: Schema.Types.ObjectId,
    ref: "packageOption"
  },
},{timestamps: true});


export const PackageModel = mongoose.model<IPackage>("package", packageSchema);