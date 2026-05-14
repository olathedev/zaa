import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

import { env } from "../../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, "../../../assets/job-card-template.png");

// Template is 1024 × 1536. Text lands in the white space left of the robot,
// below the "NEW JOB" badge (~y 820) and above the footer (~y 1320).
const TEXT = {
  titleX: 68,
  titleY: 878,
  detailX: 102,
  bulletX: 80,
  locationY: { bullet: 956, text: 968 },
  budgetY: { bullet: 1026, text: 1038 },
  dateY: { bullet: 1096, text: 1108 },
  bulletR: 7,
  bulletColor: "#1D6EF5",
  titleColor: "#0D1B4B",
  detailColor: "#444444",
  detailSize: 36,
} as const;

export type JobCardParams = {
  serviceType: string;
  location: string;
  budget: string;
  preferredDate: string;
};

export async function generateAndUploadJobCard(
  params: JobCardParams,
): Promise<string> {
  configureCloudinary();
  const buffer = await renderJobCard(params);
  return uploadToCloudinary(buffer);
}

async function renderJobCard(params: JobCardParams): Promise<Buffer> {
  const svg = buildSvg(params);

  return sharp(TEMPLATE_PATH)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function buildSvg(params: JobCardParams): string {
  const rawTitle = `${toTitleCase(params.serviceType)} Needed`;
  const titleFontSize = adaptiveTitleSize(rawTitle);
  const title = escapeXml(truncate(rawTitle, 28));
  const location = escapeXml(truncate(params.location, 34));
  const budget = escapeXml(truncate(params.budget, 34));
  const date = escapeXml(truncate(params.preferredDate, 34));

  return `<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${TEXT.titleX}" y="${TEXT.titleY}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${titleFontSize}"
    font-weight="bold"
    fill="${TEXT.titleColor}"
  >${title}</text>

  <circle cx="${TEXT.bulletX}" cy="${TEXT.locationY.bullet}" r="${TEXT.bulletR}" fill="${TEXT.bulletColor}"/>
  <text
    x="${TEXT.detailX}" y="${TEXT.locationY.text}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${TEXT.detailSize}"
    fill="${TEXT.detailColor}"
  >${location}</text>

  <circle cx="${TEXT.bulletX}" cy="${TEXT.budgetY.bullet}" r="${TEXT.bulletR}" fill="${TEXT.bulletColor}"/>
  <text
    x="${TEXT.detailX}" y="${TEXT.budgetY.text}"
    font-family="Arial, Liberation Sans, sans-serif"
    font-size="${TEXT.detailSize}"
    fill="${TEXT.detailColor}"
  >${budget}</text>

  <circle cx="${TEXT.bulletX}" cy="${TEXT.dateY.bullet}" r="${TEXT.bulletR}" fill="${TEXT.bulletColor}"/>
  <text
    x="${TEXT.detailX}" y="${TEXT.dateY.text}"
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
        {
          folder: "zaa/job-cards",
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload returned no result"));
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

// Reduce font size for longer titles so text stays inside the safe zone (~580px wide)
function adaptiveTitleSize(title: string): number {
  if (title.length <= 18) return 58;
  if (title.length <= 24) return 50;
  return 44;
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
