import { Router } from "express";
import * as categoryControll from "../controllers/category.controllers.ts";
import { verifyJWT } from "../middlewares/jwtVerify.middleware.ts";
import { verifyRole } from "../middlewares/verifyRole.middleware.ts";
import { upload } from "../middlewares/multer.middleware.ts";

const router = Router();

// open routes
router
  .route("/")
  .get(categoryControll.getCategories)
  .post(
    upload.single("icon"),
    verifyJWT,
    verifyRole("admin"),
    categoryControll.createCategory
  );

router
  .route("/:id")
  .get(categoryControll.getCategory)
  .patch(
    upload.single("icon"),
    verifyJWT,
    verifyRole("admin"),
    categoryControll.updateCategory
  ).delete(categoryControll.deleteCategory);

//secured routes

export default router;
