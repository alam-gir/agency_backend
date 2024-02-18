import { Request, Response, Router } from "express";

const router = Router();

router.route("/").post((req : Request,res : Response) => {
    const cookies = req.cookies
    res.status(200).json({message: "nothing to send"})
})


export default router