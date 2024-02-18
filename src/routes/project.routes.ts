import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/jwtVerify.middleware";
import { verifyRole } from "../middlewares/verifyRole.middleware";
import * as projectControll from "../controllers/project.controllers";

const router = Router();

// open routes

router
  .route("/")
  .get(projectControll.getProjects)
  .post(verifyJWT, verifyRole("admin"), projectControll.createProject);
router
  .route("/:id")
  .get(projectControll.getProject)
  .patch(
    upload.array("files"),
    verifyJWT,
    verifyRole("admin"),
    projectControll.updateProject
  )
  .delete(verifyJWT, verifyRole("admin"), projectControll.deleteProjectFiles);

router
  .route("/:id/update/category")
  .patch(verifyJWT, verifyRole("admin"), projectControll.updateProjectCategory);

router
  .route("/:id/delete")
  .delete(verifyJWT, verifyRole("admin"), projectControll.deleteProject);

export default router;
