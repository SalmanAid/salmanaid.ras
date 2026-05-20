"use server";

/**
 * Server action to upload user documents (identity card, family card)
 * Usage on client:
 * const result = await uploadUserDocument(file, "identityCard");
 */
export async function uploadUserDocument(
  file: File,
  documentType: "identityCard" | "familyCard"
) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch("/api/user/documents", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to upload document");
  }
}

/**
 * Get signed URL for a user document
 * Usage on client:
 * const { signedUrl } = await getUserDocumentUrl("identityCard");
 */
export async function getUserDocumentUrl(
  documentType: "identityCard" | "familyCard"
) {
  try {
    const response = await fetch(
      `/api/user/documents?documentType=${documentType}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get document");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to retrieve document");
  }
}

/**
 * Delete a user document
 * Usage on client:
 * await deleteUserDocument("identityCard");
 */
export async function deleteUserDocument(
  documentType: "identityCard" | "familyCard"
) {
  try {
    const response = await fetch(
      `/api/user/documents?documentType=${documentType}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete document");
  }
}
