import { Request } from "express";
import { IUser } from "../src/models/user.model";

export interface IGetUserInterfaceRequst extends Request {
    user?: IUser;

}

export interface IFile extends File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  }

export interface ICloudinaryFile {
    asset_id: string,
    public_id: string,
    version: number,
    version_id: string,
    signature: string,
    resource_type: string,
    created_at: date,
    tags: string[],
    bytes: number,
    type: string,
    etag: string,
    placeholder: boolean,
    url: string,
    secure_url: string,
    folder: string,
    access_mode: string,
    original_filename: string,
    api_key: string
}