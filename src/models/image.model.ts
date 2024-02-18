import mongoose, {Schema, Model, Document} from "mongoose";

export interface IImage extends Document {
    public_id : string;
    url : string;
}

const imageSchema = new Schema<IImage>({
    url: {
        type: String,
        default: ""
    },
    public_id: {
        type: String,
        default: ""
    }
},{timestamps:true})

export const ImageModel = mongoose.model<IImage>("image",imageSchema);