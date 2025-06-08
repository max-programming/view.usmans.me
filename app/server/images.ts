import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/db";
import { r2 } from "@/lib/r2";
import { randomUUID } from "node:crypto";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authMiddleware } from "@/auth-middleware";

// Add this utility function at the top
async function generateSignedUrl(
  fileKey: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileKey,
    });
    return await getSignedUrl(r2, command, { expiresIn });
  } catch (error) {
    console.error(`Error generating signed URL for key ${fileKey}:`, error);
    return null;
  }
}

// Get all images
export const getImages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const images = await db
      .selectFrom("images")
      .selectAll()
      .orderBy("id", "desc")
      .execute();

    // Generate signed URLs concurrently (already doing this with Promise.all - good!)
    // But simplify with the utility function
    const imagesWithUrls = await Promise.all(
      images.map(async image => ({
        ...image,
        filePublicUrl: await generateSignedUrl(image.fileKey),
      }))
    );

    return imagesWithUrls;
  });

// Get single image by slug
export const getImageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const image = await db
      .selectFrom("images")
      .where("slug", "=", data.slug)
      .selectAll()
      .executeTakeFirst();

    if (!image) {
      throw new Error("Image not found");
    }

    // Generate signed URL for the image
    try {
      const signedUrl = await generateSignedUrl(image.fileKey);

      return {
        ...image,
        filePublicUrl: signedUrl,
      };
    } catch (error) {
      console.error(
        `Error generating signed URL for image ${image.id}:`,
        error
      );
      return {
        ...image,
        filePublicUrl: null,
      };
    }
  });

// Get public image by slug (for public pages)
export const getPublicImageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const image = await db
      .selectFrom("images")
      .where("slug", "=", data.slug)
      .where("visibility", "in", ["public", "unlisted"]) // Only public and unlisted images
      .selectAll()
      .executeTakeFirst();

    if (!image) {
      throw new Error("Image not found or not publicly accessible");
    }

    // Generate signed URL for the image
    try {
      const signedUrl = await generateSignedUrl(image.fileKey);

      return {
        ...image,
        filePublicUrl: signedUrl,
      };
    } catch (error) {
      console.error(
        `Error generating signed URL for public image ${image.id}:`,
        error
      );
      return {
        ...image,
        filePublicUrl: null,
      };
    }
  });

export const uploadFileToR2 = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    try {
      const file = data.get("file") as File;

      if (!file) {
        throw new Error("No file provided");
      }

      const fileExtension = file.name.split(".").pop() || "";
      const fileKey = `images/${randomUUID()}.${fileExtension}`;

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.length,
      });

      await r2.send(command);

      return fileKey;
    } catch (error) {
      console.error("Error uploading to R2:", error);
      throw new Error("Failed to upload file to R2");
    }
  });

// Create new image
const createImageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  fileKey: z.string().min(1, "File key is required"),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

export const createImage = createServerFn({ method: "POST" })
  .validator(createImageSchema)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    // Check if slug already exists
    const existingImage = await db
      .selectFrom("images")
      .where("slug", "=", data.slug)
      .select("id")
      .executeTakeFirst();

    if (existingImage) {
      throw new Error("Slug already exists. Please choose a different slug.");
    }

    try {
      const fileKey = data.fileKey;
      const newImage = await db
        .insertInto("images")
        .values({
          title: data.title,
          slug: data.slug,
          description: data.description,
          visibility: data.visibility,
          fileKey: fileKey,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return newImage;
    } catch (error) {
      console.error("Error creating image:", error);
      throw new Error("Failed to create image");
    }
  });

// Delete image
export const deleteImage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number() }))
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    try {
      const image = await db
        .selectFrom("images")
        .where("id", "=", data.id)
        .select(["fileKey"])
        .executeTakeFirst();

      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from R2 first, then database
      // If R2 deletion fails, we don't want orphaned DB records
      if (image.fileKey) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: image.fileKey,
        });

        await r2.send(deleteCommand);
      }

      // Only delete from DB if R2 deletion succeeded
      await db
        .deleteFrom("images")
        .where("id", "=", data.id)
        .executeTakeFirstOrThrow();

      return { success: true };
    } catch (error) {
      console.error("Error deleting image:", error);
      // More specific error messages
      if (error instanceof Error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }
      throw new Error("Failed to delete image");
    }
  });
