import { Router } from "express";
import { verifyJWT } from "../middlewares/jwtVerify.middleware";
import { verifyRole } from "../middlewares/verifyRole.middleware";
import * as serviceControll from "../controllers/service/service.controllers";
import { serviceCreateDataValidation } from "../utils/expressValidation";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router
  .route("/")
  .get(serviceControll.getAllServices)
  .post(verifyJWT, verifyRole("admin"), serviceControll.createService);

router
  .route("/:name")
  .get(serviceControll.getSingleService)
  .patch(
    upload.single("icon"),
    verifyJWT,
    verifyRole("admin"),
    serviceControll.updateService
  );

router
  .route("/create")
  .post(
    upload.single("icon"),
    serviceCreateDataValidation,
    verifyJWT,
    verifyRole("admin"),
    serviceControll.createService
  );

export default router;
