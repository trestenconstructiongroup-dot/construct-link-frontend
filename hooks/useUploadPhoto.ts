import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { uploadProfilePhoto } from '../services/api';

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
    mutationFn: ({ token, file }: UploadPhotoVariables) =>
      uploadProfilePhoto(token, file),
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
