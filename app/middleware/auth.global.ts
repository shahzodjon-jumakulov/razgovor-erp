import { canAccessRoute } from '~/config/routes'

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { profile, isApproved, isProfileLoaded } = useAuth()
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register']
  
  // Routes accessible to non-approved users
  const pendingApprovalRoutes = ['/auth/pending-approval', ...publicRoutes]
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(to.path)
  const isPendingApprovalRoute = pendingApprovalRoutes.includes(to.path)
  
  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user.value && !isPublicRoute) {
    return navigateTo('/auth/login')
  }
  
  // If user is authenticated, check approval status and role-based access
  if (user.value && !isPublicRoute) {
    // Wait for profile to be loaded - this is critical for approval checks
    if (!isProfileLoaded.value || !profile.value) {
      // Profile is still loading, block navigation until loaded
      return
    }
    
    // Check if user is approved
    if (!isApproved.value) {
      // Non-approved users can only access pending approval page
      if (to.path !== '/auth/pending-approval') {
        return navigateTo('/auth/pending-approval')
      }
      return // Allow access to pending approval page
    }
    
    // If approved user tries to access pending approval page, redirect to dashboard
    if (isApproved.value && to.path === '/auth/pending-approval') {
      return navigateTo('/')
    }
    
    // Check if user has access to this route
    if (!canAccessRoute(profile.value.role, to.path)) {
      // Redirect to custom 403 page
      return navigateTo('/403')
    }
  }
  
  // If authenticated user tries to access auth pages (login/register), redirect to appropriate page
  if (user.value && isPublicRoute) {
    // Wait for profile to be loaded
    if (!isProfileLoaded.value || !profile.value) {
      return
    }
    
    // Redirect based on approval status
    if (!isApproved.value) {
      return navigateTo('/auth/pending-approval')
    } else {
      return navigateTo('/')
    }
  }
})
