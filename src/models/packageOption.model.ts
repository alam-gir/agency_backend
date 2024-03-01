import mongoose, { Schema, model, Document } from "mongoose";

export interface IPackageOption extends Document {
  title?: string;
  description?: string;
  delivery_time?: string;
  revision?: number | "unlimited";
  features?: string[];
  price_bdt?: number;
  price_usd?: number;
}

const packageOptionSchema = new Schema<IPackageOption>(
  {
    title: String,
    description: String,
    delivery_time: String,
    revision: String,
    features: [String],
    price_bdt: Number,
    price_usd: Number,
  },
  { timestamps: true }
);

export const PackageOptionModel = model<IPackageOption>(
  "packageOption",
  packageOptionSchema
);
