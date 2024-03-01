import { Request } from "express";
import { IServicePopulated, ServiceModel } from "../../../models/service.model";
import { ApiError } from "../../../utils/apiError";
import { isObjectId } from "../../../lib/check-object-id";
import { CategoryModel } from "../../../models/category.model";
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from "cloudinary";
import { cloudinaryConfig } from "../../../utils/cloudinary";
import { Readable } from "stream";
import { MulterFile } from "../../project.controllers";
import { io } from "../../..";
import { FileModel } from "../../../models/file.model";
import { PackageOptionModel } from "../../../models/packageOption.model";

export const updateServiceBasedOnType = async ({
  service_id,
  type,
  req,
}: {
  service_id: string;
  type: string;
  req: Request;
}) => {
  try {
    if (!isObjectId(service_id)) throw new ApiError(400, "Invalid service id");

    switch (type) {
      case "title":
      case "description":
      case "short_description":
      case "status":
        return await updateServiceDynamicField({
          service_id: service_id!,
          req,
          type: type as
            | "title"
            | "description"
            | "short_description"
            | "status",
        });

      case "category":
        return await updateServiceCategory({
          service_id,
          value: req.body.category_id!,
        });

      case "icon":
        return await updateServiceIcon({
          service_id,
          req,
        });

      case "package":
        return await updatePackage({ service_id: service_id!, req });

      default:
        throw new ApiError(400, "Invalid type!");
    }
  } catch (error: any) {
    return new ApiError(error.statusCode, error.message);
  }
};

export const updateServiceDynamicField = async ({
  service_id,
  type,
  req,
}: {
  service_id: string;
  type: "title" | "description" | "short_description" | "status";
  req: Request;
}) => {
  const field = type;
  const value = req.body[type]!;

  try {
    if (!value) throw new ApiError(400, `${field} is required`);
    const service = await ServiceModel.findByIdAndUpdate(
      service_id,
      {
        $set: {
          [field]: value,
        },
      },
      { new: true }
    )
      .then((doc) => doc)
      .catch((error) => error);

    if (service instanceof Error)
      throw new ApiError((service as any).statusCode, service.message);
    return service._doc;
  } catch (error) {
    return error;
  }
};

const updateServiceCategory = async ({
  service_id,
  value,
}: {
  service_id: string;
  value: string;
}) => {
  try {
    if (!value) throw new ApiError(400, `Category id is required`);

    if (!isObjectId(value)) throw new ApiError(400, `Invalid category id`);

    const category = await CategoryModel.findById(value);
    if (!category) throw new ApiError(404, `Category not found`);

    const service = await ServiceModel.findByIdAndUpdate(
      service_id,
      {
        $set: {
          category: value,
        },
      },
      { new: true }
    )
      .then((doc) => doc)
      .catch((error) => {
        throw new ApiError(500, error.message);
        return error;
      });

    if (service instanceof Error)
      throw new ApiError((service as any).statusCode, service.message);
    return service?._doc;
  } catch (error) {
    return error;
  }
};

const updateServiceIcon = async ({
  service_id,
  req,
}: {
  service_id: string;
  req: Request;
}) => {
  try {
    const service = (await ServiceModel.findById(service_id).populate(
      "icon"
    )) as IServicePopulated;
    if (!service) throw new ApiError(400, "Service not found!");

    const uploaded_icon = (await upload_service_icon_cloudinary({
      folder: process.env.SERVICE_IMAGE_FOLDER!,
      file: req.file!,
      resource_type: "image",
      public_id: service?.icon?.public_id,
    })) as UploadApiResponse | UploadApiErrorResponse;

    console.log({ uploaded_icon });

    if (!service?.icon?.url) {
      // if no prev icon, create one
      const icon = await FileModel.create({
        url: uploaded_icon.secure_url,
        public_id: uploaded_icon.public_id,
      });
      service.icon = icon._id;
    } else {
      const updatedImage = await FileModel.findByIdAndUpdate(
        service.icon._id,
        {
          $set: {
            url: uploaded_icon.secure_url,
            public_id: uploaded_icon.public_id,
          },
        },
        { new: true }
      )
        .then((doc) => doc)
        .catch((error) => {
          throw new ApiError(500, error.message);
          return error;
        });
      service.icon = updatedImage?._id;
    }
    const updatedService = (await service.save()) as any;
    return updatedService._doc;
  } catch (error) {
    return error;
  }
};

const upload_service_icon_cloudinary = async ({
  folder,
  resource_type = "auto",
  public_id,
  file,
}: {
  folder: string;
  resource_type: "raw" | "auto" | "image" | "video" | undefined;
  public_id?: string;
  file: MulterFile;
}) => {
  return new Promise((resolve, reject) => {
    cloudinary.config(cloudinaryConfig);

    const cloudinaryOptions = public_id
      ? {
          resource_type,
          public_id,
        }
      : {
          resource_type,
          folder,
        };

    const upload_stream = cloudinary.uploader.upload_stream(
      cloudinaryOptions,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );

    const reader = new Readable();
    let writeBytes = 0;
    const stream_size = 200;

    for (let i = 0; i < file.buffer.length; i += stream_size) {
      const chunk = file.buffer.subarray(i, i + stream_size);
      reader.push(chunk);
    }
    reader.push(null);

    reader.on("data", (chunk) => {
      writeBytes += chunk.length;
      const progress = Math.floor((writeBytes / file.size) * 100);
      io.emit("service-icon-upload-progress", progress);
    });

    reader.pipe(upload_stream);
  });
};

const updatePackage = async ({
  service_id,
  req,
}: {
  service_id: string;
  req: Request;
}) => {
  const { packagetype } = req.query;
  if (!packagetype) throw new ApiError(400, "Package type is required");
  try {
    switch (packagetype) {
      case "basic":
        return await updateBasicPackage({ service_id, req });
      case "standard":
        return await updateStandardPackage({ service_id, req });
      case "premium":
        return await updatePremiumPackage({ service_id, req });
      default:
        throw new ApiError(400, "Invalid package type");
    }
  } catch (error) {
    return error;
  }
};

const updateBasicPackage = async ({
  service_id,
  req,
}: {
  service_id: string;
  req: Request;
}) => {
  try {
    const service = await ServiceModel.findById(service_id)
      .populate("packages")
      .then((doc) => {
        if(!doc) throw new ApiError(404, "Package not found");
        return doc;
      })
      .catch((error) => {
        throw new ApiError(400, error.message);
        return error;
      });

    if (!service) throw new ApiError(400, "Service not found!");

    const data = req.body.data;
    if (!data) throw new ApiError(400, "Data is required");

    const updatedService = await PackageOptionModel.findByIdAndUpdate(
      service.packages.basic,
      { $set: data },
      { new: true }
    )
      .then((doc) => doc)
      .catch((error) => {
        throw new ApiError(500, error.message);
        return error;
      });

    return updatedService?._doc;
  } catch (error) {
    return error;
  }
};

const updateStandardPackage = async ({
  service_id,
  req,
}: {
  service_id: string;
  req: Request;
}) => {
  try {
    const service = await ServiceModel.findById(service_id)
      .populate("packages")
      .then((doc) => {
        if(!doc) throw new ApiError(404, "Package not found");
        return doc;
      })
      .catch((error) => {
        throw new ApiError(400, error.message);
        return error;
      });

    const data = req.body.data;
    if (!data) throw new ApiError(400, "Data is required");

    const updatedService = await PackageOptionModel.findByIdAndUpdate(
      service.packages.standard,
      { $set: data },
      { new: true }
    )
      .then((doc) => doc)
      .catch((error) => {
        throw new ApiError(500, error.message);
        return error;
      });

    return updatedService?._doc;
  } catch (error) {
    return error;
  }
};

const updatePremiumPackage = async ({
  service_id,
  req,
}: {
  service_id: string;
  req: Request;
}) => {
  try {
    const service = await ServiceModel.findById(service_id)
      .populate("packages")
      .then((doc) => {
        return doc;
      })
      .catch((error) => {
        throw new ApiError(400, error.message);
        return error;
      });

    const data = req.body.data;
    if (!data) throw new ApiError(400, "Data is required");
console.log({service})
    const updatedService = await PackageOptionModel.findByIdAndUpdate(
      service.packages.premium,
      { $set: data },
      { new: true }
    )
      .then((doc) => {
        if(!doc) throw new ApiError(404, "Package not found");
        return doc;
      })
      .catch((error) => {
        console.log({ error });
        throw new ApiError(400, error.message);
        return error;
      });

    return updatedService?._doc;
  } catch (error) {
    return error;
  }
};
