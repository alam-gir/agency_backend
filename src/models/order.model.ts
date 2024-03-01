import mongoose, { Schema, Document } from "mongoose";
import { IServicePopulated } from "./service.model";
import { IPackageOption } from "./packageOption.model";
import { IBuyer } from "./buyer.model";

export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId | IBuyer;
  date: Date;
  status: string;
  service: mongoose.Types.ObjectId | IServicePopulated;
  packageOption: mongoose.Types.ObjectId | IPackageOption;
  details: string;
  completed_date: Date;
}

export interface IOrderPopulated extends IOrder {
  buyer: IBuyer;
  service: IServicePopulated;
  packageOption: IPackageOption;
}

const orderSchema = new Schema<IOrder>({
  buyer: { type: mongoose.SchemaTypes.ObjectId, ref: "buyer" },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "processing", "delivered", "cancelled", "refunded"],
    default: "pending",
  },
  service: { type: mongoose.SchemaTypes.ObjectId, ref: "service" },
  packageOption: { type: mongoose.SchemaTypes.ObjectId, ref: "packageOption" },
  details: { type: String },
  completed_date: { type: Date },
});

export const OrderModel = mongoose.model<IOrder>("order", orderSchema);
