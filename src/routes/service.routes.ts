import { Router } from "express";
import { verifyJWT } from "../middlewares/jwtVerify.middleware";
import { verifyRole } from "../middlewares/verifyRole.middleware";
import * as serviceControll from "../controllers/service.controllers";
import {
  serviceCreateDataValidation,
  serviceUpdateDataValidation,
} from "../utils/expressValidation";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/").get(serviceControll.getAllServices);

router.route("/:id").get(serviceControll.getSingleService);

router
  .route("/create")
  .post(
    upload.single("icon"),
    serviceCreateDataValidation,
    verifyJWT,
    verifyRole("admin"),
    serviceControll.createService
  );

router
  .route("/:id/update")
  .patch(
    serviceUpdateDataValidation,
    verifyJWT,
    verifyRole("admin"),
    serviceControll.updateService
  );

router
  .route("/:id/update/icon")
  .patch(
    upload.single("icon"),
    verifyJWT,
    verifyRole("admin"),
    serviceControll.updateServiceIcon
  );

export default router;
