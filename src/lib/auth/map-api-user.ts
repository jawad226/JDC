import type { UserProfileDto } from '@/services/user.service';
import type { AuthLoginUserDto } from '@/lib/auth/auth.types';
import type { Department, Role, User } from '@/lib/store';

const FRONTEND_ROLES: Role[] = [
  'Admin',
  'HR',
  'Team Leader',
  'Employee',
  'Pending User',
];

function asRole(value: string): Role {
  return FRONTEND_ROLES.includes(value as Role) ? (value as Role) : 'Employee';
}

export function mapLoginUserToStore(dto: AuthLoginUserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: asRole(dto.role),
    department: (dto.department as Department) || undefined,
    phone: dto.phone ?? undefined,
    employeeCode: dto.gdc_id ?? undefined,
    avatar: dto.avatar ?? undefined,
  };
}

export function mapProfileToStoreUser(profile: UserProfileDto, id: string, role: Role): User {
  return {
    id,
    name: profile.name,
    email: profile.email,
    role,
    phone: profile.phone ?? undefined,
    department: (profile.department as Department) || undefined,
    employeeCode: profile.gdc_id ?? undefined,
    cnic: profile.cnic ?? undefined,
    address: profile.address ?? undefined,
    avatar: profile.profile_image ?? undefined,
  };
}
