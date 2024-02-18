import { Request, Response, response } from "express";
import { IGetUserInterfaceRequst } from "../../@types/custom.ts";
import { CategoryModel } from "../models/category.model.ts";
import { ProjectModel } from "../models/project.model.ts";
import { ApiError } from "../utils/apiError.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { delete_cloudinary, upload_cloudinary } from "../utils/cloudinary.ts";
import { FileModel } from "../models/file.model.ts";
import jwt from "jsonwebtoken";
import { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { io } from "../index.ts";

interface MulterFile {
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const getProjects = async (req: Request, res: Response) => {
  let { page, limit } = req.query;
  const lim = parseInt(limit as string) || 10;
  const skip = (parseInt(page as string) - 1) * lim;
  const cook = req.cookies["authjs.session-token"];
  const verify = jwt.verify(cook, "mysecret");
  try {
    // get all projects
    const projects = await ProjectModel.find()
      .skip(skip)
      .limit(lim)
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate(["category", "files", "images"])
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "failed to get all projects!");
      });

    if (!projects) throw new ApiError(404, "projects not found!");
    const total = await ProjectModel.countDocuments();
    const totalPages = Math.ceil(total / lim);

    return res.status(200).json(
      new ApiResponse(200, "success", {
        projects,
        current_page: page,
        total_pages: totalPages,
        total_docs: total,
        show_limit: lim,
      })
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from get All projects!",
        error,
      });
    }
  }
};

const getProject = async (req: Request, res: Response) => {
  const project_id = req.params.id;

  try {
    const ObjectId = /^[0-9a-fA-F]{24}$/;
    const isObjectId = ObjectId.test(project_id);
    if (!isObjectId) throw new ApiError(400, "Invalid project id!");
    // get all projects
    const project = await ProjectModel.findOne({ _id: project_id })
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate(["category", "files", "images"])
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, (err as any).message);
      });

    if (!project) throw new ApiError(404, "project not found!");

    return res.status(200).json(new ApiResponse(200, "success", project));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from get single project!",
        error,
      });
    }
  }
};

const createProject = async (req: IGetUserInterfaceRequst, res: Response) => {
  const { title, category_id } = req.body;

  const user = req.user;

  try {
    //<-------------Validation------------->
    if (!title || !category_id)
      throw new ApiError(400, "Title and category is required!");

    //<------------check category is exist or not------------>
    const category = await CategoryModel.findById(category_id);

    if (!category) throw new ApiError(404, "Invalid category!");

    // <----------------create project with name and category id-------------->
    let projectCreated = await ProjectModel.create({
      title: title,
      category: category._id,
      author: user?._id,
    })
      .then((doc) => doc)
      .catch((err) => {
        throw new ApiError(400, "Project create failed!");
      });

    const project = await ProjectModel.findById(projectCreated?._id, {
      isNew: true,
    })
      .populate("author", "-password -refreshToken")
      .populate("category");
    if (!project) throw new ApiError(404, "Project not found!");

    return res
      .status(201)
      .json(new ApiResponse(201, "Project created!", project));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error.message);
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error from create project!", error });
    }
  }
};

const updateProject = async (req: Request, res: Response) => {
  const project_id = req.params.id;
  const update = req.query.update as
    | "title"
    | "short_description"
    | "description"
    | "status"
    | "category"
    | "images"
    | "files";

  if (!update)
    return res.status(400).json({ message: "Update field is not specified!" });

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(project_id);
  if (!isObjectId)
    return res.status(400).json({ mesage: "Invalid project id!" });

  //<--------------all update function--------------->
  switch (update) {
    case "title":
      await updateProjectTitle(req, res, { id: project_id });
      break;
    case "short_description":
      await updateProjectShortDescription(req, res, { id: project_id });
      break;
    case "description":
      await updateProjectDescription(req, res, { id: project_id });
      break;
    case "status":
      await updateProjectStatus(req, res, { id: project_id });
      break;

    case "images":
      await updateProjectImages(req, res, { id: project_id });
      break;

    case "files":
      await updateProjectFile(req, res, { id: project_id });
      break;
    default:
      return res.status(400).json({ message: "Invalid update field!" });
  }
};

const deleteProjectFiles = async (req: Request, res: Response) => {
  const project_id = req.params.id;
  const delete_field = req.query.delete as "image" | "file";

  if (!project_id)
    return res.status(400).json({ message: "Project id is required!" });
  if (!delete_field)
    return res.status(400).json({ message: "Delete field is required!" });

  switch (delete_field) {
    case "file":
      await deleteProjectFile(req, res, { id: project_id });
      break;
    case "image":
      await deleteProjectImage(req, res, { id: project_id });
      break;
    default:
      return res.status(400).json({ message: "Invalid delete field!" });
  }
};

//<---------------- helping functions ------------------->

const deleteProjectFile = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  /**
   * remove from Project
   * remove from File
   * delete from cloudinary
   */
  const file_id = req.body.file_id;
  try {
    if (!file_id) throw new ApiError(400, "File id is required!");

    //<---------------remove from Project------------------->
    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { $pull: { files: file_id } },
      { new: true }
    )
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project update failed!");
      });

    //<---------------remove from File------------------->
    const file = await FileModel.findOneAndDelete({ _id: file_id })
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "File delete failed!");
      });

    //<---------------delete from cloudinary------------------->
    await delete_cloudinary(file?.public_id!);

    //<---------------final response------------------->
    return res
      .status(200)
      .json(new ApiResponse(200, "File deleted!", { ...project }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.log({ error });
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project delete file!",
        error,
      });
    }
  }
};

const deleteProjectImage = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  /**
   * remove from Project
   * remove from File
   * delete from cloudinary
   */
  const file_id = req.body.file_id;
  try {
    if (!file_id) throw new ApiError(400, "File id is required!");

    //<---------------remove from Project------------------->
    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { $pull: { images: file_id } },
      { new: true }
    )
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project update failed!");
      });

    //<---------------remove from File------------------->
    const file = await FileModel.findOneAndDelete({ _id: file_id })
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "File delete failed!");
      });

    //<---------------delete from cloudinary------------------->
    await delete_cloudinary(file?.public_id!);

    //<---------------final response------------------->
    return res
      .status(200)
      .json(new ApiResponse(200, "Image deleted!", { ...project }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.log({ error });
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project delete image!",
        error,
      });
    }
  }
};

const updateProjectTitle = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  const title = req.body.title;

  try {
    if (!title) throw new ApiError(400, "Title is required!");

    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { title },
      { new: true }
    )
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project update title failed!");
      });

    if (!project) throw new ApiError(404, "Project not found!");

    return res
      .status(200)
      .json(new ApiResponse(200, "Project title updated!", { ...project }));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update title!",
        error,
      });
    }
  }
};

const updateProjectDescription = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  const description = req.body.description;

  try {
    if (!description) throw new ApiError(400, "Description is required!");

    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { description },
      { new: true }
    ).catch((err) => {
      if (err) throw new ApiError(400, "Project update description failed!");
    });
    if (!project) throw new ApiError(404, "Project not found!");

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Project description updated!", { ...project })
      );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update description!",
        error,
      });
    }
  }
};

const updateProjectShortDescription = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  const short_description = req.body.short_description;

  try {
    if (!short_description)
      throw new ApiError(400, "Short Description is required!");

    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { short_description },
      { new: true }
    ).catch((err) => {
      if (err)
        throw new ApiError(400, "Project update short description failed!");
    });
    if (!project) throw new ApiError(404, "Project not found!");

    return res.status(200).json(
      new ApiResponse(200, "Project short description updated!", {
        ...project,
      })
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update short description!",
        error,
      });
    }
  }
};

const updateProjectStatus = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  const status = req.body.status as "published" | "archived";

  try {
    if (status !== "published" && status !== "archived")
      throw new ApiError(400, "Status must be published or archived");

    const project = await ProjectModel.findByIdAndUpdate(
      { _id: id },
      { status },
      { new: true }
    )
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project update status failed!");
      });
    if (!project) throw new ApiError(404, "Project not found!");

    return res
      .status(200)
      .json(new ApiResponse(200, "Project status updated!", { ...project }));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update status!",
        error,
      });
    }
  }
};

const updateProjectImages = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  try {
    //<---------------no image found------------------->
    if (!req.files?.length) throw new ApiError(400, "Images is required!");

    //<---------------no project found------------------->
    const project = await ProjectModel.findById(id);

    if (!project) throw new ApiError(404, "Project not found!");

    //<---------------upload images to cloudinary------------------->

    if (!Array.isArray(req.files))
      throw new ApiError(400, "Images is required!");

    const uploadPromises: Promise<UploadApiResponse | undefined>[] =
      req.files?.map((file: MulterFile) => {
        return new Promise((resolve, reject) => {
          const upload_stream = cloudinary.uploader.upload_stream(
            {
              folder: process.env.PROJECT_IMAGE_FOLDER!,
              resource_type: "image",
              context: {
                file_name: file.originalname,
              },
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          const read_stream = new Readable();
          read_stream.push(file.buffer);
          read_stream.push(null);
          read_stream.pipe(upload_stream);
          upload_stream.on("data", (chunk) => console.log({ chunk }));
        });
      });

    const uploaded: (UploadApiResponse | undefined)[] = await Promise.all(
      uploadPromises
    );

    // //<---------------save images in the DB------------------->
    const dbImagePromises = uploaded.map((image) => {
      return FileModel.create({
        title: (
          image?.context as { custom: { file_name: "HABIBUR RAHMAN.docx" } }
        ).custom.file_name,
        url: image?.secure_url,
        public_id: image?.public_id,
      });
    });

    const dbImages = await Promise.all(dbImagePromises);

    if (!dbImages.length)
      throw new ApiError(400, "Images failed to save in db!");

    // //<---------------add images in project------------------->
    project.images.push(...dbImages.map((image) => image._id));

    const updatedProject = await project.save();

    if (!updatedProject)
      throw new ApiError(400, "Project update images failed!");

    //<---------------final response------------------->
    return res
      .status(200)
      .json(new ApiResponse(200, "Images uploaded!", { ...updateProject }));
  } catch (error) {
    console.log({ error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update images!",
        error,
      });
    }
  }
};

const updateProjectFile = async (
  req: Request,
  res: Response,
  { id }: { id: string }
) => {
  try {
    //<---------------no files found------------------->
    if (!Array.isArray(req.files))
      throw new ApiError(400, "Files is required!");

    //<---------------no project found------------------->
    const project = await ProjectModel.findById(id);

    if (!project) throw new ApiError(404, "Project not found!");

    //<---------------upload files to cloudinary------------------->
    const uploadPromises: Promise<UploadApiResponse | undefined>[] =
      req.files.map((file: MulterFile) => {
        return new Promise((resolve, reject) => {
          const fileSize = file.size;
          let writeBytes = 0;
          const upload_stream = cloudinary.uploader.upload_stream(
            {
              folder: process.env.PROJECT_FILE_FOLDER!,
              resource_type: "auto",
              context: {
                file_name: file.originalname,
              },
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          const read_stream = new Readable();

          const chunk_size = 200;
          for (let i = 0; i < file.buffer.length; i += chunk_size) {
            const chunk = file.buffer.subarray(i, i + chunk_size);
            read_stream.push(chunk);
          }

          read_stream.push(null);

          read_stream.on("data", (chunk) => {
            
            writeBytes += chunk.length;
            const progress = Math.floor((writeBytes / fileSize) * 100);
            
            io.emit("file-upload-progress", progress);
          });

          read_stream.pipe(upload_stream);
        });
      });

    const uploaded = await Promise.all(uploadPromises);

    //<---------------save files in the DB------------------->
    const dbFilePromises = uploaded.map((file) => {
      return FileModel.create({
        title: (
          file?.context as { custom: { file_name: "HABIBUR RAHMAN.docx" } }
        ).custom.file_name,
        url: file?.secure_url,
        public_id: file?.public_id,
      });
    });

    const dbFiles = await Promise.all(dbFilePromises);

    if (!dbFiles.length) throw new ApiError(400, "Files failed to save in db!");

    //<---------------add files in project------------------->
    project.files.push(...dbFiles.map((file) => file._id));

    const updatedProject = await project.save();

    if (!updatedProject)
      throw new ApiError(400, "Project update files failed!");

    //<---------------final response------------------->
    return res
      .status(200)
      .json(new ApiResponse(200, "Files uploaded!", { ...updatedProject }));
  } catch (error) {
    console.log({ error });
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      console.log("from else", { error });
      return res.status(500).json({
        message: (error as any).message,
      });
    }
  }
};

const updateProjectCategory = async (req: Request, res: Response) => {
  const project_id = req.params.id;
  const categoryId = req.body.categoryId;

  try {
    if (!project_id || !categoryId)
      throw new ApiError(400, "Project Id and category id is required!");

    const category = await CategoryModel.findById(categoryId)
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Category found failed!");
      });

    if (!category) throw new ApiError(404, "category not found!");

    const project = await ProjectModel.findByIdAndUpdate(
      { _id: project_id },
      { category: category._id },
      { new: true }
    )
      .populate("author", { name: 1, email: 1, role: 1 })
      .populate("category")
      .populate("files")
      .populate("images")
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project update status failed!");
      });

    if (!project) throw new ApiError(404, "Project not found!");

    return res
      .status(200)
      .json(new ApiResponse(200, "Project category updated!", project));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res.status(500).json({
        message: "Internal server error from project update category!",
        error,
      });
    }
  }
};

const deleteProject = async (req: Request, res: Response) => {
  const project_id = req.params.id;
  try {
    if (!project_id) throw new ApiError(404, "Project Id is required!");
    const deleted = (await ProjectModel.deleteOne({ _id: project_id })
      .then((doc) => doc)
      .catch((err) => {
        if (err) throw new ApiError(400, "Project delete failed!");
      })) as { acknowledged: boolean; deletedCount: number };

    if (!deleted.deletedCount) throw new ApiError(404, "Project not found!");

    return res
      .status(200)
      .json(new ApiResponse(200, "Project deleted successfully!"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          errorCode: error.statusCode,
          message: error.message,
        },
      });
    } else if ((error as any).name === "ValidationError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).code === 11000 || (error as any).code === 11001) {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else if ((error as any).name === "CastError") {
      return res.status(400).json(new ApiError(400, (error as any).message));
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error from delete project!", error });
    }
  }
};

export {
  createProject,
  getProjects,
  getProject,
  updateProject,
  updateProjectCategory,
  deleteProjectImage,
  deleteProjectFiles,
  deleteProject,
};
