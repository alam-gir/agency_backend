import mongoose , {Document, Schema} from 'mongoose';
import { IImage } from './image.model';

export interface IService extends Document {
    title: string;
    description: string;
    short_description: string;
    status: string;
    icon: mongoose.Types.ObjectId | IImage;
    packages: mongoose.Types.ObjectId[];
    category: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
}

export interface IServicePopulated extends IService {
    icon: IImage;
}

const serviceSchema = new Schema<IService>({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true
    },
    short_description:{
        type: String,
        required: true
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    icon: {
        type: Schema.Types.ObjectId,
        ref: 'image'
    },
    packages: [{
        type: Schema.Types.ObjectId,
        ref: 'package'
    }],
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
})

export const ServiceModel = mongoose.model<IService>('service', serviceSchema);