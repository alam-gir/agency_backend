import mongoose, { Document, Schema } from "mongoose";



export interface IBuyer extends Document {
    name: string;
    email: string;
    phone: string;
}

const BuyerModelSchema = new Schema<IBuyer>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
});


export const BuyerModel = mongoose.model<IBuyer>("buyer", BuyerModelSchema)