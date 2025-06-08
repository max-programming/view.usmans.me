import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Plus, Trash2, FileImage, Copy } from "lucide-react";
import { getImages, deleteImage } from "@/server/images";

export const Route = createFileRoute("/_authed/images/")({
  component: ImagesListPage,
  loader: async () => {
    const images = await getImages();
    return images;
  },
});

function ImagesListPage() {
  const images = Route.useLoaderData();
  const [deleteImageId, setDeleteImageId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (imageId: number) => {
    setIsDeleting(true);
    try {
      await deleteImage({ data: { id: imageId } });
      setDeleteImageId(null);
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-green-100 text-green-800";
      case "unlisted":
        return "bg-yellow-100 text-yellow-800";
      case "private":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const getPublicUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${slug}`;
    }
    return `https://view.usmans.me/${slug}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Images</h1>
          <p className="text-muted-foreground">Manage your image collection</p>
        </div>
        <Link to="/images/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add New Image
          </Button>
        </Link>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No images found
            </p>
            <Link to="/images/new">
              <Button>
                <Plus className="w-4 h-4" />
                Add Your First Image
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map(image => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-square overflow-hidden bg-muted">
                {image.filePublicUrl ? (
                  <img
                    src={image.filePublicUrl}
                    alt={image.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">
                    {image.title}
                  </CardTitle>
                  <Badge className={getVisibilityColor(image.visibility)}>
                    {image.visibility}
                  </Badge>
                </div>
                {image.description && (
                  <CardDescription className="line-clamp-2">
                    {image.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Link
                    to="/images/$slug"
                    params={{ slug: image.slug }}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getPublicUrl(image.slug))}
                    title="Copy public link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteImageId(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Image</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{image.title}"? This
                          action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteImageId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
