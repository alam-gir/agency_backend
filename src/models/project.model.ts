import mongoose, {Document, Schema} from "mongoose";
import { ICategory } from "./category.model";
import { IImage } from "./image.model";
import { IFile } from "./file.model";

export interface IProject extends Document{
    title : string
    description: string
    short_description: string
    category: mongoose.Types.ObjectId | ICategory
    images : mongoose.Types.ObjectId[] | IImage[]
    files : mongoose.Types.ObjectId[] | IFile[]
    author : mongoose.Types.ObjectId
    status : "published" | "unpublished"
}

interface IProjectPopulate extends Document, IProject {
    category : ICategory;
    images : IImage[];
    files : IFile[];
}

const projectSchema = new Schema<IProject>({
    title: {
        type : String,
        required : true,
    },
    description: {
        type : String,
    },
    short_description: {
        type : String,
    },
    status: {
        type : String,
        enum : ["published", "unpublished"],
        default : "unpublished"
    },
    author: {
        type : Schema.ObjectId,
        ref: "user",
        required: true
    },
    category: {
        type : Schema.ObjectId,
        ref: "category",
    },
    files: [{
        type : Schema.ObjectId,
        ref: "file",
    }],
    images: [{
        type : Schema.ObjectId,
        ref: "file",
    }],
},{timestamps: true})


export const ProjectModel = mongoose.model<IProject>("project",projectSchema);