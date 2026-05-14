import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

import { env } from "../../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, "../../../assets/acceptance-template.png");

// Coordinates assume a 1024 × 1536 template (same format as job card).
// Update these once the actual template is designed.
const TEXT = {
  titleX: 68,
  titleY: 878,
  detailX: 102,
  bulletX: 80,
  serviceY: { bullet: 956, text: 968 },
  locationY: { bullet: 1026, text: 1038 },
  dateY: { bullet: 1096, text: 1108 },
  bulletR: 7,
  bulletColor: "#1D6EF5",
  titleColor: "#0D1B4B",
  detailColor: "#444444",
  detailSize: 36,
} as const;

export type AcceptanceCardParams = {
  serviceType: string;
  location: string;
  preferredDate: string;
};

/**
 * Tries to generate and upload an acceptance card image.
 * Returns the Cloudinary URL on success, or null if the template
 * doesn't exist yet or anything goes wrong — caller always falls
 * back to plain text.
 */
export async function tryGenerateAcceptanceCard(
  params: AcceptanceCardParams,
): Promise<string | null> {
  if (!existsSync(TEMPLATE_PATH)) {
    return null;
  }

  try {
    configureCloudinary();
    const buffer = await renderCard(params);
    return await uploadToCloudinary(buffer);
  } catch (error) {
    console.error("Acceptance card generation failed — falling back to text", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
    });
    return null;
  }
}

async function renderCard(params: AcceptanceCardParams): Promise<Buffer> {
  const svg = buildSvg(params);

  return sharp(TEMPLATE_PATH)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function buildSvg(params: AcceptanceCardParams): string {
  const rawTitle = toTitleCase(params.serviceType);
  const titleFontSize = rawTitle.length <= 18 ? 58 : rawTitle.length <= 24 ? 50 : 44;
  const title = escapeXml(truncate(rawTitle, 28));
  const location = escapeXml(truncate(params.location, 34));
  const date = escapeXml(truncate(params.preferredDate, 34));

  return `<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${TEXT.titleX}" y="${TEXT.titleY}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${titleFontSize}"
    font-weight="bold"
    fill="${TEXT.titleColor}"
  >${title}</text>

  <circle cx="${TEXT.bulletX}" cy="${TEXT.serviceY.bullet}" r="${TEXT.bulletR}" fill="${TEXT.bulletColor}"/>
  <text
    x="${TEXT.detailX}" y="${TEXT.serviceY.text}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${TEXT.detailSize}"
    fill="${TEXT.detailColor}"
  >${location}</text>

  <circle cx="${TEXT.bulletX}" cy="${TEXT.locationY.bullet}" r="${TEXT.bulletR}" fill="${TEXT.bulletColor}"/>
  <text
    x="${TEXT.detailX}" y="${TEXT.locationY.text}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${TEXT.detailSize}"
    fill="${TEXT.detailColor}"
  >${date}</text>
</svg>`;
}

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "zaa/acceptance-cards", resource_type: "image", format: "png" },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(`Cloudinary upload failed: ${JSON.stringify(error ?? "no result")}`),
            );
          }
          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
