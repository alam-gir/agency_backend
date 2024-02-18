import mongoose, { Document, Schema } from "mongoose";

export interface IPackage extends Document {
  type: string;
  description: string;
  price_bdt: number;
  price_usd: number;
  icon: mongoose.Types.ObjectId;
  delivery_time: string;
  features: string[];
  revision_time: number;
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  status: "active" | "inactive";

}

const packageSchema = new Schema<IPackage>({
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    require: true,
  },
  price_bdt: {
    type: Number,
    required: true,
  },
  price_usd: {
    type: Number,
    required: true,
  },
  icon: {
    type: Schema.Types.ObjectId,
    ref: "image",
  },
  delivery_time: {
    type: String,
    require: true,
  },
  features: [{
    type: String,
    required: true,
  }],
  revision_time:{
    type: Number,
    require: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "category",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "user"
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

});


export const PackageModel = mongoose.model<IPackage>("package", packageSchema);