/** Payload returned on successful POST /api/auth/login */
export interface AuthLoginUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  gdc_id?: string | null;
  avatar?: string | null;
  /** From `teams.name` when user has `team_id` */
  team_name?: string | null;
  /** From `teams.department` (site) when user has a team */
  work_site?: string | null;
}

export interface AuthLoginResponse {
  message: string;
  token: string;
  user: AuthLoginUserDto;
}
