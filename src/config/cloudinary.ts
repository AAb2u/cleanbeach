export const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

export function isCloudinaryConfigured() {
  return Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
}
