import { Platform } from 'react-native';
import { cloudinaryConfig } from '../config/cloudinary';

interface UploadableImage {
  uri: string;
  base64?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message?: string };
}

async function readCloudinaryResponse(response: Response): Promise<CloudinaryUploadResponse> {
  try {
    return await response.json() as CloudinaryUploadResponse;
  } catch {
    return {};
  }
}

function getUploadUrl() {
  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
}

function getFileName(image: UploadableImage, index: number) {
  if (image.fileName) return image.fileName;
  const extension = image.mimeType?.split('/')[1] || 'jpg';
  return `cleanbeach-report-${Date.now()}-${index}.${extension}`;
}

async function appendFile(formData: FormData, image: UploadableImage, index: number) {
  const fileName = getFileName(image, index);
  const mimeType = image.mimeType || 'image/jpeg';

  if (image.base64) {
    formData.append('file', `data:${mimeType};base64,${image.base64}`);
    return;
  }

  if (Platform.OS === 'web') {
    const blob = await fetch(image.uri).then((response) => response.blob());
    formData.append('file', blob, fileName);
    return;
  }

  formData.append('file', {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
}

export async function uploadReportImage(image: UploadableImage, index = 0): Promise<string> {
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    throw new Error('Cloudinary is not configured.');
  }

  const formData = new FormData();
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  await appendFile(formData, image, index);

  const response = await fetch(getUploadUrl(), {
    method: 'POST',
    body: formData,
  });

  const payload = await readCloudinaryResponse(response);
  if (!response.ok || !payload.secure_url) {
    const reason = payload.error?.message || `Cloudinary upload failed (${response.status}).`;
    throw new Error(`${reason} Verifiez le cloud name et le preset unsigned.`);
  }

  return payload.secure_url;
}

export async function uploadReportImages(images: UploadableImage[]): Promise<string[]> {
  return Promise.all(images.map((image, index) => uploadReportImage(image, index)));
}
