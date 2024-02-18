import mongoose , {Document, Schema} from "mongoose";
import { IImage } from "./image.model";
export interface ICategory extends Document {
    title: string;
    icon: mongoose.Types.ObjectId | IImage;
    author: mongoose.Types.ObjectId;
}

export interface ICategoryPopulate extends Document, ICategory{
    icon : IImage
}

const categorySchema = new Schema<ICategory>({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: Schema.ObjectId,
        ref: "file"
    },
    author: {
        type: Schema.ObjectId,
        ref: "user"
    }
},{timestamps:true});

export const CategoryModel = mongoose.model<ICategory>("category", categorySchema);
