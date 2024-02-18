import mongoose, { Schema, Document, mongo } from 'mongoose';
import { IUser } from './user.model';
import { IService } from './service.model';
import { IPackage } from './package.model';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId | IUser;
  date: Date;
  status: string;
  service: mongoose.Types.ObjectId | IService;
  package: mongoose.Types.ObjectId | IPackage;
  payment_info: mongoose.Types.ObjectId[]; //| IPaymentInfo;
  subtotal_bdt: number;
  subtotal_usd: number;
  advance_amount_bdt: number;
  advance_amount_usd: number;
  due_bdt: number;
  due_usd: number;
  notes: string;
  required_info: mongoose.Types.ObjectId; //| IRequiredInfo;
  review: mongoose.Types.ObjectId; //| IReview;
  completed_date: Date;
}

const orderSchema = new Schema<IOrder>({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: "user" },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["pending", "processing", "delivered", "cancelled", "refunded"],
        default: "pending"
    },
    service: { type: mongoose.SchemaTypes.ObjectId, ref: "service" },
    package: { type: mongoose.SchemaTypes.ObjectId, ref: "package" },
    payment_info: [{ type: mongoose.SchemaTypes.ObjectId, ref: "payment_info" }],
    subtotal_bdt: { type: Number, required: true },
    subtotal_usd: { type: Number, required: true },
    advance_amount_bdt: { type: Number, default: 0 },
    advance_amount_usd: { type: Number, default: 0 },
    due_bdt: { type: Number, default: function(){ return this.subtotal_bdt} },  
    due_usd: { type: Number, default: function(){ return this.subtotal_usd} },  
    notes: { type: String },
    required_info: { type: mongoose.SchemaTypes.ObjectId, ref: "required_info" },
    review: { type: mongoose.SchemaTypes.ObjectId, ref: "review" },
    completed_date: { type: Date },
})


export const OrderModel = mongoose.model<IOrder>("order", orderSchema);