import Router from 'express';
import * as packageControll from '../controllers/package.controllers.ts'
import { packageCreateDataValidation } from '../utils/expressValidation.ts';
import { verifyJWT } from '../middlewares/jwtVerify.middleware.ts';
import { verifyRole } from '../middlewares/verifyRole.middleware.ts';
import { upload } from '../middlewares/multer.middleware.ts';
import { check } from 'express-validator';
const router = Router();

// open routes
router.route('/').get(packageControll.getAllPackage);
router.route('/:id').get(packageControll.getSinglePackage);

// protected routes
router.route('/create').post(upload.single('icon') ,packageCreateDataValidation ,verifyJWT ,verifyRole("admin") , packageControll.createPackage);

router.route('/:id/update/title').patch( verifyJWT ,verifyRole("admin") , packageControll.updatePackageTitle);
router.route('/:id/update/description').patch( verifyJWT ,verifyRole("admin") , packageControll.updatePackageDescription);
router.route('/:id/update/status').patch( verifyJWT ,verifyRole("admin") , packageControll.updatePackageStatus);
router.route('/:id/update/icon').patch( upload.single('icon') ,verifyJWT , verifyRole("admin") , packageControll.updatePackageIcon);
router.route('/:id/update/category').patch( verifyJWT , verifyRole("admin") , packageControll.updatePackageCategory);
router.route('/:id/update/price').patch( verifyJWT , verifyRole("admin") , packageControll.updatePackagePrice);
router.route('/:id/update/deliverytime').patch( verifyJWT , verifyRole("admin") , packageControll.updatePackageDeliveryTime);
router.route('/:id/update/revisiontime').patch( verifyJWT , verifyRole("admin") , packageControll.updatePackageRevisionTime);
router.route('/:id/update/features').patch([check('features','features must be a array of string!').notEmpty().isArray()], verifyJWT , verifyRole("admin") , packageControll.updatePackageFeatures);


export default router;