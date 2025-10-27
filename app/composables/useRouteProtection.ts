import { canAccessRoute, protectedRoutes } from '~/config/routes'
import type { UserRole } from '~/types/role'

export const useRouteProtection = () => {
  const { userRole, isAuthenticated, profile } = useAuth()
  const route = useRoute()

  // Get current user role with better reactivity
  const currentUserRole = computed(() => {
    return profile.value?.role || null
  })

  // Check if current route is accessible by user
  const canAccessCurrentRoute = computed(() => {
    if (!isAuthenticated.value) return false
    return canAccessRoute(currentUserRole.value, route.path)
  })

  // Check if a specific route is accessible
  const canAccess = (routePath: string): boolean => {
    if (!isAuthenticated.value) return false
    return canAccessRoute(currentUserRole.value, routePath)
  }

  // Get user's accessible routes
  const accessibleRoutes = computed(() => {
    if (!currentUserRole.value) return []
    return protectedRoutes.filter(route => 
      route.allowedRoles.includes(currentUserRole.value!)
    )
  })

  // Redirect to appropriate page if access denied
  const redirectIfUnauthorized = async (targetPath?: string) => {
    const pathToCheck = targetPath || route.path
    
    if (!isAuthenticated.value) {
      await navigateTo('/auth/login')
      return false
    }

    if (!canAccessRoute(currentUserRole.value, pathToCheck)) {
      // Redirect to dashboard or show 403 error
      await navigateTo('/')
      return false
    }

    return true
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!currentUserRole.value) return false
    return roles.includes(currentUserRole.value)
  }

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    return currentUserRole.value === role
  }

  // Check if user is admin
  const isAdmin = computed(() => currentUserRole.value === 'superadmin')

  // Check if user is teaching staff
  const isTeachingStaff = computed(() => 
    currentUserRole.value ? ['teacher', 'head_teaching'].includes(currentUserRole.value) : false
  )

  // Check if user is sales staff
  const isSalesStaff = computed(() => 
    currentUserRole.value ? ['sales', 'head_sales'].includes(currentUserRole.value) : false
  )

  // Check if user is management (head roles + superadmin)
  const isManagement = computed(() => 
    currentUserRole.value ? ['head_teaching', 'head_sales', 'superadmin'].includes(currentUserRole.value) : false
  )

  return {
    // Route access
    canAccessCurrentRoute,
    canAccess,
    accessibleRoutes,
    redirectIfUnauthorized,
    
    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeachingStaff,
    isSalesStaff,
    isManagement,
    
    // Current user info
    userRole: readonly(currentUserRole),
    isAuthenticated: readonly(isAuthenticated)
  }
}
