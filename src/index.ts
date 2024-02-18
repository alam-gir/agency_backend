import app from "./app";
import dotenv from "dotenv";
import { connectDB } from "./utils/db";
import http from "http";
import cluster from "node:cluster";
import os from "os";
import { Server } from "socket.io";

dotenv.config({});

const numCPUs = os.cpus().length;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const port = process.env.PORT;
connectDB()
  .then((db) => {
    if (cluster.isPrimary) {
      console.log(`Primary ${process.pid} is running`);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
      cluster.on("exit", (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
      });
    } else {
      const serverConnection = server.listen(port, () => {
        console.log("Server run at port -> ", port);
      });
      serverConnection.timeout = 60000 * 5;
    }
  })
  .catch((error) => console.log(error.message));
