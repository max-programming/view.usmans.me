import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X, FileImage } from "lucide-react";
import { createImage, uploadFileToR2 } from "@/server/images";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";

type FileResult = {
  file: File;
  fileName: string;
  fileSize: number;
  contentType: string;
};

export const Route = createFileRoute("/_authed/images/new")({
  component: NewImagePage,
  head: () => ({
    meta: [{ title: "Add New Image" }],
  }),
});

function NewImagePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "public" as "public" | "unlisted" | "private",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const dropzoneProps = useDropzone<FileResult, string>({
    onDropFile: async (file: File) => {
      // Just store the file locally, don't upload yet
      return {
        status: "success",
        result: {
          file,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        },
      };
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    onFileUploaded: result => {
      console.log("File ready for upload:", result);
    },
    onFileUploadError: error => {
      console.error("File error:", error);
    },
  });

  const uploadedFile = dropzoneProps.fileStatuses.find(
    f => f.status === "success"
  );
  const hasUploadedImage = uploadedFile?.status === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasUploadedImage) {
      setError("Please upload an image first");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const imageFormData = new FormData();
      imageFormData.append("file", uploadedFile.file);
      const fileKey = await uploadFileToR2({ data: imageFormData });
      const slug = generateSlug(formData.title);
      await createImage({
        data: {
          title: formData.title,
          slug,
          description: formData.description,
          visibility: formData.visibility,
          fileKey,
        },
      });
      navigate({ to: "/images" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create image");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatedSlug = formData.title ? generateSlug(formData.title) : "";

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate({ to: "/images" })}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Image</h1>
          <p className="text-muted-foreground">
            Upload and configure a new image
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
          </CardHeader>
          <CardContent>
            <Dropzone {...dropzoneProps}>
              <DropZoneArea className="min-h-[200px]">
                <div className="flex flex-col items-center justify-center text-center">
                  <FileImage className="w-12 h-12 text-muted-foreground mb-4" />
                  <DropzoneTrigger className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choose image or drag and drop
                  </DropzoneTrigger>
                </div>
              </DropZoneArea>

              <DropzoneMessage />

              <DropzoneFileList>
                {dropzoneProps.fileStatuses.map(fileStatus => (
                  <DropzoneFileListItem key={fileStatus.id} file={fileStatus}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileImage className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">
                            {fileStatus.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileStatus.status === "pending" && "Processing..."}
                            {fileStatus.status === "success" &&
                              "Ready to upload"}
                            {fileStatus.status === "error" && "Invalid file"}
                          </p>
                        </div>
                      </div>
                      <DropzoneRemoveFile variant="outline" size="sm">
                        <X className="w-4 h-4" />
                      </DropzoneRemoveFile>
                    </div>
                  </DropzoneFileListItem>
                ))}
              </DropzoneFileList>
            </Dropzone>
          </CardContent>
        </Card>

        {/* Image Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Image Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter image title"
                  required
                />
                {generatedSlug && (
                  <p className="text-sm text-muted-foreground">
                    URL will be: /images/{generatedSlug}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "public" | "unlisted" | "private") =>
                    setFormData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      Public - Visible to everyone
                    </SelectItem>
                    <SelectItem value="unlisted">
                      Unlisted - Only accessible via direct link
                    </SelectItem>
                    <SelectItem value="private">
                      Private - Only visible to you
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/images" })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !hasUploadedImage || !formData.title.trim()
                  }
                >
                  {isSubmitting ? "Uploading & Creating..." : "Create Image"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
