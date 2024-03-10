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
          { path: "basic" },
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
  const service_name = req.params.name;
  try {
    // get all services
    const service = await ServiceModel.findOne({ title: service_name })
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate(["category", "icon"])
      .populate({
        path: "packages",
        populate: [
          { path: "basic" },
          { path: "standard" },
          { path: "premium" },
        ],
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
  const service_name = req.params.name;
  const type = req.query.type;

  try {
    const serviceByName = await ServiceModel.findOne({ title: service_name });
    if (!serviceByName) throw new ApiError(404, "Service not found!");
    const service_id = serviceByName._id;

    if (!type || !service_id)
      throw new ApiError(400, "Type and service name is required!");

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

export { createService, getAllServices, getSingleService, updateService };
