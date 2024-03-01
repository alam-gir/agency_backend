import { Response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom";
import { ApiError } from "../utils/apiError";
import { OrderModel } from "../models/order.model";
import { ServiceModel } from "../models/service.model";
import { PackageModel } from "../models/package.model";
import { ApiResponse } from "../utils/apiResponse";
import { BuyerModel, IBuyer } from "../models/buyer.model";
import { isObjectId } from "../lib/check-object-id";
import { PackageOptionModel } from "../models/packageOption.model";

const placeOrder = async (req: IGetUserInterfaceRequst, res: Response) => {
  //get data from request
  const { buyer, service_id, package_option_id } = req.body as {
    buyer: IBuyer;
    service_id: string;
    package_option_id: string;
  };
  console.log({ buyer, service_id, package_option_id });
  try {
    // validate data
    if (!buyer || !isObjectId(service_id) || !isObjectId(package_option_id))
      throw new ApiError(400, "Invalid data");

    // set data to db
    const order = await saveOrder({ buyer, service_id, package_option_id });

    // send response
    return res
      .status(201)
      .json(new ApiResponse(201, "Order placed successfully", { ...order }));
  } catch (error) {
    console.log("error from place order", { error });
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(new ApiError(error.statusCode, error.message));
    } else if (error instanceof Error) {
      return res.status(400).json(new ApiError(400, error.message));
    } else {
      return res
        .status(500)
        .json(new ApiError(500, "Internal server error from place order!"));
    }
  }
};

const saveOrder = async ({
  buyer,
  service_id,
  package_option_id,
}: {
  buyer: IBuyer;
  service_id: string;
  package_option_id: string;
}) => {
  // service is exist or not
  const service = await ServiceModel.findById(service_id)
    .then((doc) => doc)
    .catch((err) => {
      if (err) throw new ApiError((err as any).code, (err as any).message);
    });
  if (!service) throw new ApiError(404, "Service not found!");

  // package option is exist or not
  const package_option = await PackageOptionModel.findById(package_option_id)
    .then((doc) => doc)
    .catch((err) => {
      if (err) throw new ApiError((err as any).code, (err as any).message);
    });
  if (!package_option) throw new ApiError(404, "Package option not found!");

  // check Buyer already exist
  let buyer_data = await BuyerModel.findOne({ email: buyer.email });

  if (!buyer_data) {
    // create buyer
    buyer_data = await BuyerModel.create(buyer)
      .then((doc) => doc as any)
      .catch((err) => {
        if (err) throw new ApiError((err as any).code || 400, err.message);
      });
  }

  if (!buyer_data) {
    throw new ApiError(400, "something went wrong! buyer not created!");
  }

  // create order
  const order = await OrderModel.create({
    buyer: buyer_data._id,
    service: service_id,
    packageOption: package_option_id,
  })
    .then((doc) => doc as any)
    .catch((err) => {
      if (err) throw new ApiError((err as any).code || 400, err);
    });

  if (!order)
    throw new ApiError(400, "something went wrong! order not created!");
  return order;
};

export { placeOrder };

// const placeOrder = async (req: IGetUserInterfaceRequst, res: Response) => {
//   const guest_user = req.user;
//   const guest_user_data = matchedData(req);
//   try {

//     // service is exist or not
//     const service = await ServiceModel.findById(guest_user_data.service_id)
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError((err as any).code, (err as any).message);
//       });
//     if (!service) throw new ApiError(404, "Service not found!");
//     // package is exist or not
//     const package_data = await PackageModel.findById(guest_user_data.package_id)
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError((err as any).code, (err as any).message);
//       });
//     if (!service) throw new ApiError(404, "Package not found!");

//     // create order
//     const order = await OrderModel.create({
//       user: guest_user?._id,
//       service: guest_user_data.service_id,
//       package: guest_user_data.package_id,
//       notes: guest_user_data.notes,
//       subtotal_bdt: package_data?.price_bdt,
//       subtotal_usd: package_data?.price_usd,
//       advance_amount_bdt: guest_user_data.advance_amount_bdt,
//       advance_amount_usd: guest_user_data.advance_amount_usd,
//       due_bdt:
//         package_data?.price_bdt! - parseInt(guest_user_data.advance_amount_bdt),
//       due_usd:
//         package_data?.price_usd! - parseInt(guest_user_data.advance_amount_usd),
//     })
//       .then((doc) => doc)
//       .catch((err) => {
//         if (err) throw new ApiError((err as any).code || 400, err);
//       });

//     if (!order)
//       throw new ApiError(400, "something went wrong! order not created!");

//     return res
//       .status(201)
//       .json(new ApiResponse(201, "Order placed successfully", order));
//   } catch (error) {
//     // instance of ApiError
//     // validationError
//     // castError
//     // DuplicateKeyError 11000 | 11001
//     // interval error
//     if (error instanceof ApiError) {
//       if (error.statusCode === 11000 || error.statusCode === 11001)
//         return res.status(409).json(new ApiError(409, "duplicate"));
//       return res
//         .status(error.statusCode)
//         .json(new ApiError(error.statusCode, error.message));
//     } else if ((error as any).name === "ValidationError") {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else if ((error as any).name === "CastError") {
//       return res.status(404).json(new ApiError(404, (error as any).message));
//     } else if (
//       (error as any).code === "11000" ||
//       (error as any).code === "11001"
//     ) {
//       return res.status(400).json(new ApiError(400, (error as any).message));
//     } else {
//       return res
//         .status(500)
//         .json(new ApiError(500, "Internal server error from place order!"));
//     }
//   }
// };
