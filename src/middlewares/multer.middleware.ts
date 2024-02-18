import multer, { StorageEngine } from "multer";
import { v4 as uuidv4 } from "uuid";

// Configure Multer storage options
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, './public/temp'); // Specify upload directory
//     },
//     filename: (req, file, cb) => {
//       // Rename file with custom logic (e.g., add timestamp)
//       const uniqueSuffix = Date.now();
//       cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
//   });

const storage = multer.memoryStorage();
// Create Multer upload middleware
export const upload = multer({ storage: storage });
