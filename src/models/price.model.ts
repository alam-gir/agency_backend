import { Document, Schema, model } from "mongoose";

export interface IPrice extends Document {
  bdt: number;
  usd: number;
}
const priceSchema = new Schema({
  bdt: Number,
  usd: Number,
},{timestamps: true});

export const PriceModel = model<IPrice>("price", priceSchema);
