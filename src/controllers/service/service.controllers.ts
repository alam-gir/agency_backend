import { Request, Response } from "express";
import { IGetUserInterfaceRequst } from "../../../@types/custom";
import { CategoryModel } from "../../models/category.model";
import { ApiError } from "../../utils/apiError";
import { ServiceModel } from "../../models/service.model";
import { ApiResponse } from "../../utils/apiResponse";
import { isObjectId } from "../../lib/check-object-id";
import { CreateStartupService } from "./helper/create-service";
import { updateServiceBasedOnType } from "./helper/update-service";

const getAllServices = async (req: Request, res: Response) => {
  let { page, limit } = req.query;
  const lim = parseInt(limit as string) || 10;
  const skip = (parseInt(page as string) - 1) * lim;
  try {
    // get all services
    const services = await ServiceModel.find()
      .skip(skip)
      .limit(lim)
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate("category")
      .populate("icon")
      .populate({
        path: "packages",
        populate: [
          { path: "basic"},
          { path: "standard" },
          { path: "premium" },
        ],
      })
      .then((doc) => {

        return doc;
      })
      .catch((err) => {
        if (err) throw new ApiError(400, err.message);
      });

    console.log({ services });
    if (!services) throw new ApiError(404, "services not found!");
    const total = await ServiceModel.countDocuments();
    const totalPages = Math.ceil(total / lim);

    return res.status(200).json(
      new ApiResponse(200, "success", {
        services,
        current_page: page,
        total_pages: totalPages,
        total_docs: total,
        show_limit: lim,
      })
    );
  } catch (error) {
    console.log("From get all services.", { error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from get All services!",
        error,
      });
    }
  }
};

const getSingleService = async (req: Request, res: Response) => {
  const service_id = req.params.id;
  try {
    // get all services
    const service = await ServiceModel.findOne({ _id: service_id })
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate(["category", "icon"])
      .populate({
        path: "packages",
        populate: [
          { path: "basic"},
          { path: "standard" },
          { path: "premium" },
        ]
      })
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "failed to get service!");
      });

    if (!service) throw new ApiError(404, "service not found!");

    return res.status(200).json(new ApiResponse(200, "success", service));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from get single service!",
        error,
      });
    }
  }
};

const createService = async (req: IGetUserInterfaceRequst, res: Response) => {
  // verify data
  const { title, category_id } = req.body as {
    title: string;
    category_id: string;
  };
  const user = req.user;
  try {
    // throw verification errors
    if (!title || !category_id)
      throw new ApiError(400, "Title and category are required!");
    if (!isObjectId(category_id))
      throw new ApiError(400, "Invalid category id!");

    //check service isExist
    let service = await ServiceModel.findOne({ title });
    if (service) throw new ApiError(400, "Service already exist!");

    // check category is exist or not
    let category = await CategoryModel.findById(category_id);
    if (!category) throw new ApiError(404, "Category not found!");

    // create service
    service = await CreateStartupService({
      title,
      category_id,
      author_id: user?._id,
    })!;
    if (service instanceof ApiError) throw service;

    return res
      .status(201)
      .json(new ApiResponse(201, "Service created!", service));
  } catch (error) {
    console.log("From create startup service.", { error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    } else {
      return res
        .status((error as any).statusCode)
        .json({ message: (error as any).message });
    }
  }
};

const updateService = async (req: IGetUserInterfaceRequst, res: Response) => {
  const service_id = req.params.id;
  const type = req.query.type;

  try {
    if (!type || !service_id)
      throw new ApiError(400, "Type and service_id is required!");

    const service = await ServiceModel.findById(service_id);
    if (!service) throw new ApiError(404, "Service not found!");

    const data = await updateServiceBasedOnType({
      service_id,
      type: type as string,
      req,
    });
    if (!data)
      throw new ApiError(400, "Service update failed! something went wrong!");
    if (data instanceof ApiError) throw data;

    return res
      .status(201)
      .json(new ApiResponse(201, "Service updated!", { ...data }));
  } catch (error) {
    console.log("From update service.", { error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    } else {
      return res
        .status((error as any).statusCode)
        .json({ message: (error as any).message });
    }
  }
};

// const updateService = async (req: IGetUserInterfaceRequst, res: Response) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) return res.status(404).json(errors.array());
//   const service_id = req.params.id;

//   const data = matchedData(req) as {
//     title: string;
//     description: string;
//     short_description?: string;
//     status?: string;
//     category_id: string;
//     package_ids: string[];
//   };

//   try {
//     // check service is exist or not
//     const service = await ServiceModel.findById(service_id)
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError(400, "Service found failed!", err);
//       });

//     if (!service) throw new ApiError(404, "Service not found!");

//     // check category is exist or not
//     const category = await CategoryModel.findById(data.category_id)
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError(404, "Category found failed!", err);
//       });

//     if (!category) throw new ApiError(404, "Category not found!");

//     // rearrange package ids
//     const package_ids = await Promise.all(data.package_ids.map(async(id) => {
//       const pack = await PackageModel.findById(id);
//       if(pack) return pack._id;
//     }));

//     // update service with new data
//     service.title = data.title;
//     service.description = data.description;

//     if (data.short_description) {
//       service.short_description = data.short_description;
//     }

//     if (data.status) {
//       service.status = data.status;
//     }
//     service.category = category._id;

//     service.packages = package_ids;

//     // save service
//     await service
//       .save()
//       .then((doc) => doc)
//       .catch((err) => {
//         console.error(err);
//         if (err) throw new ApiError(500, "Service save failed!");
//       });

//     return res
//       .status(201)
//       .json(new ApiResponse(201, "Service updated!", service));
//   } catch (error) {
//     if (error instanceof ApiError) {
//       return res.status(error.statusCode).json({
//         error: {
//           errorCode: error.statusCode,
//           message: error.message,
//         },
//       });
//     } else if ((error as any).name === "ValidationError") {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else if ((error as any).code === 11000 || (error as any).code === 11001) {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else if ((error as any).name === "CastError") {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else {
//       return res.status(500).json({
//         message: "Internal server error from create update!",
//         error: error,
//       });
//     }
//   }
// };

// const updateServiceIcon = async (
//   req: IGetUserInterfaceRequst,
//   res: Response
// ) => {
//   const service_id = req.params.id;
//   const iconPath = req.file?.path;

//   try {
//     if(!iconPath) throw new ApiError(400, "Icon not found!")
//     // check service is exist or not
//     const service = await ServiceModel.findById(service_id)
//     .populate('icon')
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError(400, "Service found failed!", err);
//       }) as IServicePopulated;

//     if (!service) throw new ApiError(404, "Service not found!");

//     const old_icon = service.icon;

//     // upload icon to cloudinary
//     const uploadedIcon = await upload_cloudinary(
//       iconPath!,
//       process.env.ICON_FOLDER!
//     );

//     // save icon details in DB
//     const icon = await ImageModel.create({
//       url: uploadedIcon!.secure_url,
//       public_id: uploadedIcon!.public_id,
//     })
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError(500, "Icon save to db failed!", err);
//       });

//     // update service with new data
//     service.icon = icon!._id;

//     // save service
//     const updatedService = await service
//       .save()
//       .then((doc) => doc)
//       .catch((err) => {
//         console.error(err);
//         if (err) throw new ApiError(500, "Service save failed!");
//       });

//       // delete icon from cloudinary
//       await delete_cloudinary(old_icon.public_id);

//       // delete old icon docs from db
//       await ImageModel.findByIdAndDelete(old_icon._id);

//     return res
//       .status(201)
//       .json(new ApiResponse(201, "Service icon updated!", updatedService));
//   } catch (error) {
//     if (error instanceof ApiError) {
//       return res.status(error.statusCode).json({
//         error: {
//           errorCode: error.statusCode,
//           message: error.message,
//         },
//       });
//     } else if ((error as any).name === "ValidationError") {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else if ((error as any).code === 11000 || (error as any).code === 11001) {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else if ((error as any).name === "CastError") {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else {
//       return res.status(500).json({
//         message: "Internal server error from service update icon!",
//         error: error,
//       });
//     }
//   }
// };

export { createService, getAllServices, getSingleService, updateService };
