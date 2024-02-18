import { CorsOptions } from "cors";
const whitlists = ["http://localhost:3000", "http://localhost:3001"];
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (whitlists.indexOf(origin!) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by from this ORIGIN."));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
