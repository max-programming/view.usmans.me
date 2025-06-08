import { createFileRoute } from "@tanstack/react-router";
import { FileImage } from "lucide-react";
import { getPublicImageBySlug } from "@/server/images";

export const Route = createFileRoute("/$slug")({
  component: PublicImagePage,
  loader: async ({ params }) => {
    try {
      const image = await getPublicImageBySlug({ data: { slug: params.slug } });
      return image;
    } catch (error) {
      throw new Error("Image not found");
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title ?? "Image Viewer" }],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
          Image Not Found
        </h1>
        <p className="text-gray-600 px-4">
          The image you're looking for doesn't exist or is not publicly
          accessible.
        </p>
      </div>
    </div>
  ),
});

function PublicImagePage() {
  const image = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Simple header with just title */}
      <header className="bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-medium text-center">
            {image.title}
          </h1>
          {image.description && (
            <p className="text-gray-400 text-sm sm:text-base text-center mt-2 max-w-2xl mx-auto">
              {image.description}
            </p>
          )}
        </div>
      </header>

      {/* Full focus on the image */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full">
          {image.filePublicUrl ? (
            <img
              src={image.filePublicUrl}
              alt={image.title}
              className="
                w-full h-auto 
                max-h-[calc(100vh-6rem)]
                max-w-full
                object-contain 
                mx-auto
                block
              "
              loading="lazy"
              decoding="async"
              style={{
                imageRendering: "auto" as const,
                maxWidth: "min(100vw, 120vh)",
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileImage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Unable to load image</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
