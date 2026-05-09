import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.routes.js";
import { twilioWhatsAppWebhookRouter } from "./routes/webhooks/twilio-whatsapp.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(
    cors({
      origin: env.webOrigin,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/", (_req, res) => {
    res.json({
      name: "Zaa API",
      status: "online",
    });
  });

  app.use("/health", healthRouter);
  app.use("/webhooks/twilio", twilioWhatsAppWebhookRouter);
  app.use("/webhooks/twilio/whatsapp", twilioWhatsAppWebhookRouter);
  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  console.error("Unhandled API error", {
    method: req.method,
    path: req.originalUrl,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(500).json({
    error: "Internal server error",
     message: error instanceof Error ? error.message : String(error),

  });
};
