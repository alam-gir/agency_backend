import Router from "express";
import * as orderControll from "../controllers/order.controllers";
import * as validation from "../utils/expressValidation";
import { createGuestUser } from "../middlewares/guestUser.middleware";
import { verifyJWT } from "../middlewares/jwtVerify.middleware";

const router = Router();

router
  .route("/place")
  .post(validation.orderCreateDataValidation, createGuestUser, verifyJWT, orderControll.placeOrder);

export default router;
