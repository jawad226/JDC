/**
 * Paths relative to `NEXT_PUBLIC_API_URL` (Express API).
 */
export const API_PATHS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    verifyEmail: '/api/auth/verify-email',
    forgotPassword: '/api/auth/forgot-password',
    verifyResetEmail: '/api/auth/verify-reset-email',
    verifyOtp: '/api/auth/verify-otp',
    resetPassword: '/api/auth/reset-password',
    resendOtp: '/api/auth/resend-otp',
    logout: '/api/auth/logout',
    deleteUser: (hashId: string) => `/api/auth/delete-user/${encodeURIComponent(hashId)}`,
  },
  profile: {
    get: '/api/profile/getProfile',
    update: '/api/profile/updateProfile',
  },
  admin: {
    pendingUsers: '/api/admin/pending-users',
    approveUser: '/api/admin/approve-user',
    rejectUser: '/api/admin/reject-user',
    allUsers: '/api/admin/Allusers',
    updateRole: (id: string | number) => `/api/admin/update-role/${id}`,
  },
  teams: {
    create: '/api/teams/createTeam',
    list: '/api/teams/getTeams',
    myTeamRoster: '/api/teams/my-team-roster',
    delete: (id: string | number) => `/api/teams/deleteTeam/${id}`,
    detachMember: '/api/teams/detach-member',
    addEmployees: '/api/teams/add-employees',
    moveMember: '/api/teams/move-member',
  },
} as const;
