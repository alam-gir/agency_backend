import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  title?: string;
  public_id: string;
  url: string;
}

const fileSchema = new Schema<IFile>(
  {
    title: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const FileModel = mongoose.model<IFile>("file", fileSchema);
