import { API_PATHS } from '@/lib/api/api-base-urls';
import { apiGet, apiPut } from '@/lib/api/axios-request-handler';

/** Shape returned by Express GET /api/profile/getProfile (see gdc-backend getProfileModel). */
export interface UserProfileDto {
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  gdc_id: string | null;
  cnic: string | null;
  address: string | null;
  profile_image: string | null;
}

export type UpdateProfileResponse = {
  message: string;
  user: Record<string, unknown>;
};

/**
 * Fetches the authenticated user's profile.
 * Requires a JWT in the `accessToken` cookie (Bearer) unless you extend the axios interceptor.
 */
export function getCurrentUserProfile(): Promise<UserProfileDto> {
  return apiGet<UserProfileDto>(API_PATHS.profile.get);
}

/**
 * PUT /api/profile/updateProfile — multipart when `imageFile` is set (field name `image`),
 * otherwise same fields as form data (matches multer + Express).
 * Backend image limit is 2 MB.
 */
export function updateProfileApi(
  fields: {
    name: string;
    email: string;
    phone: string;
    department: string;
    cnic: string;
    address: string;
  },
  imageFile?: File | null
): Promise<UpdateProfileResponse> {
  const form = new FormData();
  form.append('name', fields.name);
  form.append('email', fields.email);
  form.append('phone', fields.phone);
  form.append('department', fields.department);
  form.append('cnic', fields.cnic);
  form.append('address', fields.address);
  if (imageFile) form.append('image', imageFile);
  return apiPut<UpdateProfileResponse>(API_PATHS.profile.update, form);
}
