import mongoose, { Schema, model, Document } from "mongoose";

export interface IPackageOption extends Document {
  title?: string;
  description?: string;
  delivery_time?: string;
  revision?: number | "unlimited";
  features?: string[];
  price?: mongoose.Types.ObjectId;
}

const packageOptionSchema = new Schema<IPackageOption>(
  {
    title: String,
    description: String,
    delivery_time: String,
    revision: String,
    features: [String],
    price: {
      type: Schema.Types.ObjectId,
      ref: "price",
    },
  },
  { timestamps: true }
);

export const PackageOptionModel = model<IPackageOption>(
  "packageOption",
  packageOptionSchema
);
