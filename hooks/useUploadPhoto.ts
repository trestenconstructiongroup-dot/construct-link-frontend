import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { uploadProfilePhoto } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadPhotoVariables {
  token: string;
  file: File;
}

interface UploadPhotoResult {
  photo_url: string;
}

export function useUploadPhoto(
  options?: Omit<UseMutationOptions<UploadPhotoResult, Error, UploadPhotoVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, file }: UploadPhotoVariables) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Promise.reject(new Error('Only JPEG, PNG, and WebP images are supported.'));
      }
      if (file.size > MAX_FILE_SIZE) {
        return Promise.reject(new Error('Image must be smaller than 5 MB.'));
      }
      return uploadProfilePhoto(token, file);
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['individualProfile'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      options?.onSuccess?.(...args);
    },
    ...options,
    // Ensure our onSuccess runs even if caller provides their own
  });
}
