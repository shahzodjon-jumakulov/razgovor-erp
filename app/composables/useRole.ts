import type { UserRole } from '~/types/role'

export const useRole = () => {
  const { userRole, hasRole, hasAnyRole } = useAuth()
  
  return {
    role: userRole,
    is: hasRole,
    hasAny: hasAnyRole
  }
}
