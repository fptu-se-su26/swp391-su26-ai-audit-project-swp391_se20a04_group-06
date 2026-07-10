const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

function buildCloudinaryTransformation(width, height) {
  return `w_${width},h_${height},c_fill,q_auto,f_auto`;
}

/**
 * Adds a delivery transformation to Cloudinary images while leaving external
 * and local image URLs untouched.
 */
export function getOptimizedImageUrl(imageUrl, width = 800, height = 500) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.includes("res.cloudinary.com") ||
    !imageUrl.includes(CLOUDINARY_UPLOAD_SEGMENT)
  ) {
    return imageUrl || "";
  }

  const transformation = buildCloudinaryTransformation(width, height);
  const transformedSegment = `${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/`;

  if (imageUrl.includes(transformedSegment)) return imageUrl;
  return imageUrl.replace(CLOUDINARY_UPLOAD_SEGMENT, transformedSegment);
}

export function getRecipeImageSrcSet(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.includes("res.cloudinary.com") ||
    !imageUrl.includes(CLOUDINARY_UPLOAD_SEGMENT)
  ) {
    return "";
  }

  return [480, 800, 1200]
    .map((width) => {
      const height = Math.round((width * 5) / 8);
      return `${getOptimizedImageUrl(imageUrl, width, height)} ${width}w`;
    })
    .join(", ");
}
