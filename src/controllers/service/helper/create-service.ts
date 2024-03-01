import { PackageModel } from "../../../models/package.model";
import {
  IPackageOption,
  PackageOptionModel,
} from "../../../models/packageOption.model";
import { IPrice, PriceModel } from "../../../models/price.model";
import { ServiceModel } from "../../../models/service.model";
import { ApiError } from "../../../utils/apiError";

export const CreateStartupService = async ({
  title,
  category_id,
  author_id,
}: {
  title: string;
  category_id: string;
  author_id: string;
}) => {
  try {
    //create prices for the packages
    const { basicPackagePrice, premiumPackagePrice, standardPackagePrice } =
      await createPricesForPackages();

    // create package options
    const { basicPackage, premiumPackage, standardPackage } =
      await createPackageOptions({
        basic_price_id: basicPackagePrice._id,
        standard_price_id: standardPackagePrice._id,
        premium_price_id: premiumPackagePrice._id,
      });

    // create empty package
    const packages = await PackageModel.create({
      basic: basicPackage._id,
      standard: standardPackage._id,
      premium: premiumPackage._id,
    })
      .then((doc) => doc)
      .catch((error) => error);

    // create a startup service
    const service = await ServiceModel.create({
      title,
      category: category_id,
      author: author_id,
      packages: packages._id,
    })
      .then((doc) => doc)
      .catch((error) => error);

    return service;
  } catch (error) {
    return error
  }
};




const createPricesForPackages = async () => {
  //create empty price for basic packaeg
  let basicPackagePricePromise = PriceModel.create({})
    .then((doc) => doc)
    .catch((error) => error);

  //create empty price for standard package
  let standardPackagePricePromise = PriceModel.create({})
    .then((doc) => doc)
    .catch((error) => error);

  //create empty price for premium package
  let premiumPackagePricePromise = PriceModel.create({})
    .then((doc) => doc)
    .catch((error) => error);

  // wait for all the promises to resolve
  const [basicPackagePrice, standardPackagePrice, premiumPackagePrice]: [
    IPrice,
    IPrice,
    IPrice
  ] = await Promise.all([
    basicPackagePricePromise,
    standardPackagePricePromise,
    premiumPackagePricePromise,
  ]);

  return { basicPackagePrice, standardPackagePrice, premiumPackagePrice };
};

const createPackageOptions = async ({
  basic_price_id,
  standard_price_id,
  premium_price_id,
}: {
  basic_price_id: string;
  standard_price_id: string;
  premium_price_id: string;
}) => {
  //create empty package option => basic
  let basicPackagePromise = PackageOptionModel.create({
    price: basic_price_id,
  })
    .then((doc) => doc)
    .catch((error) => error);

  //create empty package option => basic
  let standardPackagePromise = PackageOptionModel.create({
    price: standard_price_id,
  })
    .then((doc) => doc)
    .catch((error) => error);

  //create empty package option => basic
  let premiumPackagePromise = await PackageOptionModel.create({
    price: premium_price_id,
  })
    .then((doc) => doc)
    .catch((error) => error);

  // wait for all the promises to resolve
  const [basicPackage, standardPackage, premiumPackage]: [
    IPackageOption,
    IPackageOption,
    IPackageOption
  ] = await Promise.all([
    basicPackagePromise,
    standardPackagePromise,
    premiumPackagePromise,
  ]);

  return { basicPackage, standardPackage, premiumPackage };
};
