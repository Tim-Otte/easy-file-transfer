import express from "express";
import { createServer } from "http";
import { handler } from "../build/handler.js";
import { startSignalingServer } from "./websocket/prod-server.js";

const app = express();
app.use(handler);

const port = 3000;
const server = createServer(app);

startSignalingServer(server);

server.listen(port);

process.on('SIGTERM', () => { server.closeAllConnections(); process.exit(); });
process.on('SIGINT', () => { server.closeAllConnections(); process.exit(); });