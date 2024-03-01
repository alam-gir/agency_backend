import mongoose , {Document, Schema} from 'mongoose';
import { IImage } from './image.model';
import { IFile } from './file.model';
import { IPackage } from './package.model';
import { ICategory } from './category.model';
import { IUser } from './user.model';

export interface IService extends Document {
    title: string;
    description?: string;
    short_description?: string;
    status: "active" | "inactive";
    icon?: mongoose.Types.ObjectId | IImage;
    packages: mongoose.Types.ObjectId | IPackage;
    category: mongoose.Types.ObjectId | ICategory;
    author: mongoose.Types.ObjectId | IUser;   
}

export interface IServicePopulated extends IService {
    icon: IFile,
    packages: IPackage,
    category: ICategory,
    author: IUser
}

const serviceSchema = new Schema<IService>({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
    },
    short_description:{
        type: String,
    },
    status:{
        enum: ["active", "inactive"],
        type: String,
        default: "inactive"
    },
    icon: {
        type: Schema.Types.ObjectId,
        ref: 'file',
    },
    packages: {
        type: Schema.Types.ObjectId,
        ref: 'package'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
},{timestamps: true})

export const ServiceModel = mongoose.model<IService>('service', serviceSchema);