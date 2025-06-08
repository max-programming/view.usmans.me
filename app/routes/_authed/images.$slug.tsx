import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Copy,
  FileImage,
  Link,
} from "lucide-react";
import { getImageBySlug, deleteImage } from "@/server/images";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authed/images/$slug")({
  component: ImageDetailPage,
  loader: async ({ params }) => {
    const image = await getImageBySlug({ data: { slug: params.slug } });
    return image;
  },
});

function ImageDetailPage() {
  const { slug } = Route.useParams();
  const image = Route.useLoaderData();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteImage({ data: { id: image.id } });
      navigate({ to: "/images" });
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const getPublicUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${image.slug}`;
    }
    return `https://view.usmans.me/${image.slug}`;
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/images" })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{image.title}</h1>
            <p className="text-muted-foreground">
              Image details and management
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(getPublicUrl())}
          >
            <Link className="w-4 h-4" />
            Copy Public Link
          </Button>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="w-4 h-4 " />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Image</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{image.title}"? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
        {/* Image Display */}
        <div className="xl:col-span-3 lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                {image.filePublicUrl ? (
                  <img
                    src={image.filePublicUrl}
                    alt={image.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Details</CardTitle>
                <Badge className={getVisibilityColor(image.visibility)}>
                  {image.visibility}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Title
                </h3>
                <p className="text-sm">{image.title}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Slug
                </h3>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {image.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(image.slug)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <Separator />

              {image.description && (
                <>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Description
                    </h3>
                    <p className="text-sm">{image.description}</p>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Image URL
                </h3>
                {image.filePublicUrl ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {image.filePublicUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(image.filePublicUrl!)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={image.filePublicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Image URL not available
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Public Link
                </h3>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {getPublicUrl()}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getPublicUrl())}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={getPublicUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  Visibility
                </h3>
                <div className="text-sm">
                  <Badge className={getVisibilityColor(image.visibility)}>
                    {image.visibility}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {image.visibility === "public" && "Visible to everyone"}
                    {image.visibility === "unlisted" &&
                      "Only accessible via direct link"}
                    {image.visibility === "private" && "Only visible to you"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
