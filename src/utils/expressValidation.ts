import { check } from "express-validator";
import { isBdPhone, isRole } from "./necessaryFunc";
import mongoose from "mongoose";

const registerUserDataValidation = [
  check("name", "Name must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("name must have minimum 3 characters!")
    .isLength({ max: 20 })
    .withMessage("name maximum have 20 characters!"),

  check("email", "Email must required!")
    .notEmpty()
    .isEmail()
    .withMessage("Valid email needed!"),

  check("password", "Password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const loginUserDataValidation = [
  check("email", "Email must required!")
    .notEmpty()
    .isEmail()
    .withMessage("Valid email needed!"),

  check("password", "Password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const passwordDataValidation = [
  check("current_password", "current password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),

  check("confirm_password", "confirm password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const emailDataValidation = [
  check("email", "Email must required!")
    .notEmpty()
    .isEmail()
    .withMessage("Valid email needed!"),

  check("current_password", "current password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const phoneDataValidation = [
  check("phone", "Phone Number must required!")
    .notEmpty()
    .custom(isBdPhone)
    .withMessage("Valid bangladeshi phone number needed!"),

  check("current_password", "current password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];
const nameDataValidation = [
  check("name", "Name is required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("name must have minimum 3 characters!")
    .isLength({ max: 20 })
    .withMessage("name maximum have 20 characters!"),

  check("current_password", "current password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const roleDataValidation = [
  check("role", "role must be 'user' or 'admin' or 'super-admin'!").custom(
    isRole
  ),

  check("current_password", "current password must required!")
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("password must have minimum 5 characters!")
    .isLength({ max: 20 })
    .withMessage("password maximum have 20 characters!"),
];

const categoryDataValidation = [
  check("title", "title must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("Category title minimum 3 characters required!")
    .isLength({ max: 30 })
    .withMessage("Category title max 30 characters!"),
];

const projectCreateDataValidation = [
  check("title", "Title must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("name must have minimum 3 characters!")
    .isLength({ max: 80 })
    .withMessage("name maximum have 80 characters!"),

  check("category_id", "Category Id not found!").notEmpty(),
];

const packageCreateDataValidation = [
  check("type", "Type must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("type must have minimum 3 characters!")
    .isLength({ max: 30 })
    .withMessage("type maximum have 30 characters!"),

  check("description", "Description must required!")
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage("Description minimum 10 characters!")
    .isLength({ max: 500 })
    .withMessage("Description maximum 500 characters!"),

  check("category_id", "Category Id not found!").notEmpty(),

  check("price_bdt", "Price must required!").notEmpty(),

  check("price_usd", "Price must required!").notEmpty(),

  check("delivery_time", "Delivery time must required!").notEmpty(),

  check("features", "Features must required!")
    .notEmpty()
    .isArray()
    .withMessage("Features must be array!"),

  check("revision_time", "Revision time must required!").notEmpty(),
];

const serviceCreateDataValidation = [
  check("title", "title must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("title must have minimum 3 characters!")
    .isLength({ max: 80 })
    .withMessage("title maximum have 80 characters!"),

  check("description", "Description must required!")
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage("Description minimum 10 characters!")
    .isLength({ max: 500 })
    .withMessage("Description maximum 500 characters!"),

  check("short_description", "Short Description must required!")
    .custom((value) => {
      if (value) {
        if (value < 6 || value.length > 100) return false;
        else return true;
      } else return true;
    })
    .withMessage(
      "Short Description must have minimum 6 characters and maximum 100 characters!"
    ),

  check("status", "Status must required!")
    .custom((value) => {
      if (value) {
        if (value === "active" || value === "inactive") return true;
        else return false;
      } else return true;
    })
    .withMessage("Status must be 'active' or 'inactive'!"),

  check("package_ids", "package ids must required!")
    .notEmpty()
    .isArray()
    .withMessage("package ids must be array!"),

  check("category_id", "Category Id not found!").notEmpty(),
];

const serviceUpdateDataValidation = [
  check("title", "title must required!")
    .notEmpty()
    .isLength({ min: 3 })
    .withMessage("title must have minimum 3 characters!")
    .isLength({ max: 80 })
    .withMessage("title maximum have 80 characters!"),

  check("description", "Description must required!")
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage("Description minimum 10 characters!")
    .isLength({ max: 500 })
    .withMessage("Description maximum 500 characters!"),

  check("short_description", "Short Description must required!")
    .custom((value) => {
      if (value) {
        if (value < 6 || value.length > 100) return false;
        else return true;
      } else return true;
    })
    .withMessage(
      "Short Description must have minimum 6 characters and maximum 100 characters!"
    ),

  check("status", "Status must required!")
    .custom((value) => {
      if (value) {
        if (value === "active" || value === "inactive") return true;
        else return false;
      } else return true;
    })
    .withMessage("Status must be 'active' or 'inactive'!"),

  check("category_id", "Category Id not found!").notEmpty(),

  check("package_ids", "package ids must required!")
    .notEmpty()
    .isArray()
    .withMessage("package ids must be array!"),
];

const orderCreateDataValidation = [
  check("name", "Name must required!").notEmpty(),

  check("email", "Email must required!").notEmpty().isEmail().withMessage("Valid email needed!"),

  check("phone", "Phone Number must required!").notEmpty().custom(isBdPhone).withMessage("Valid bangladeshi phone number needed!"),

  check("service_id", "Service Id not found!")
    .notEmpty()
    .custom((value) => {
        return mongoose.Types.ObjectId.isValid(value);
    }).withMessage("Service Id not valid!"),

  check("package_id", "Package Id not found!").notEmpty().custom((value) => {
    return mongoose.Types.ObjectId.isValid(value);
  }).withMessage("Package Id not valid!"),

  check("advance_amount_bdt").default(0),
  check("advance_amount_usd").default(0),

];

export {
  registerUserDataValidation,
  loginUserDataValidation,
  passwordDataValidation,
  emailDataValidation,
  phoneDataValidation,
  nameDataValidation,
  roleDataValidation,
  categoryDataValidation,
  projectCreateDataValidation,
  packageCreateDataValidation,
  serviceCreateDataValidation,
  serviceUpdateDataValidation,
  orderCreateDataValidation
};
