import { Router } from "express";
import * as authController from "../controllers/auth.controllers.ts";
import { registerUserDataValidation } from "../utils/expressValidation.ts";

const router = Router();

router.route("/register").post(registerUserDataValidation,authController.registerUser);
router.route("/login/credential").post( authController.loginUser);
router.route("/login/provider").post(authController.loginUserProvider);
router.route("/provider/:id/update").get(authController.updateProviderAccessToken);
router.route("/refresh-token").get(authController.refreshToken);
router.route("/send-verification-mail").post(authController.sendVerificationMail);
router.route("/verify-mail").get(authController.verifyMail);

//secured
router.route("/logout").post(authController.logoutUser);

export default router;