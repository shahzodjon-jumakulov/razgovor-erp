import type { UserRole } from '~/types/role'

export interface RoutePermission {
  path: string
  allowedRoles: UserRole[]
  description?: string
}

// Define protected routes and their allowed roles
export const protectedRoutes: RoutePermission[] = [
  // Admin-only routes
  {
    path: '/users',
    allowedRoles: ['superadmin'],
    description: 'User management - superadmin only'
  },
  {
    path: '/users/*',
    allowedRoles: ['superadmin'],
    description: 'User management sub-pages - superadmin only'
  },
  
  // Teaching staff routes (teachers and head_teaching)
  {
    path: '/students',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Student management - teaching staff'
  },
  {
    path: '/students/*',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Student management sub-pages - teaching staff'
  },
  {
    path: '/lessons',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Lesson management - teaching staff'
  },
  {
    path: '/lessons/*',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Lesson management sub-pages - teaching staff'
  },
  {
    path: '/evaluations',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Student evaluations - teaching staff'
  },
  {
    path: '/evaluations/*',
    allowedRoles: ['teacher', 'head_teaching', 'superadmin'],
    description: 'Student evaluations sub-pages - teaching staff'
  },
  
  // Sales staff routes
  {
    path: '/leads',
    allowedRoles: ['sales', 'head_sales', 'superadmin'],
    description: 'Lead management - sales staff'
  },
  {
    path: '/leads/*',
    allowedRoles: ['sales', 'head_sales', 'superadmin'],
    description: 'Lead management sub-pages - sales staff'
  },
  
  // Head roles + superadmin routes
  {
    path: '/reports',
    allowedRoles: ['head_teaching', 'head_sales', 'superadmin'],
    description: 'Reports and analytics - management only'
  },
  {
    path: '/reports/*',
    allowedRoles: ['head_teaching', 'head_sales', 'superadmin'],
    description: 'Reports sub-pages - management only'
  },
  {
    path: '/settings',
    allowedRoles: ['head_teaching', 'head_sales', 'superadmin'],
    description: 'System settings - management only'
  },
  {
    path: '/settings/*',
    allowedRoles: ['head_teaching', 'head_sales', 'superadmin'],
    description: 'Settings sub-pages - management only'
  }
]

// Helper function to check if a user role can access a specific route
export const canAccessRoute = (userRole: UserRole | null, routePath: string): boolean => {
  if (!userRole) return false
  
  // Find matching route permission
  const routePermission = protectedRoutes.find(route => {
    // Handle wildcard routes
    if (route.path.endsWith('/*')) {
      const basePath = route.path.slice(0, -2)
      return routePath.startsWith(basePath)
    }
    return route.path === routePath
  })
  
  // If no specific permission found, allow access (public route)
  if (!routePermission) return true
  
  // Check if user role is in allowed roles
  return routePermission.allowedRoles.includes(userRole)
}

// Get routes accessible by a specific role
export const getAccessibleRoutes = (userRole: UserRole | null): RoutePermission[] => {
  if (!userRole) return []
  
  return protectedRoutes.filter(route => 
    route.allowedRoles.includes(userRole)
  )
}

// Get role-based navigation items
export const getNavigationItems = (userRole: UserRole | null) => {
  if (!userRole) return []
  
  const navItems = []
  
  // Dashboard is always accessible
  navItems.push({
    name: 'Dashboard',
    path: '/',
    icon: 'Home'
  })
  
  // Admin routes
  if (userRole === 'superadmin') {
    navItems.push({
      name: 'Users',
      path: '/users',
      icon: 'Users'
    })
  }
  
  // Teaching staff routes
  if (['teacher', 'head_teaching', 'superadmin'].includes(userRole)) {
    navItems.push(
      {
        name: 'Students',
        path: '/students',
        icon: 'GraduationCap'
      },
      {
        name: 'Lessons',
        path: '/lessons',
        icon: 'BookOpen'
      },
      {
        name: 'Evaluations',
        path: '/evaluations',
        icon: 'FileText'
      }
    )
  }
  
  // Sales staff routes
  if (['sales', 'head_sales', 'superadmin'].includes(userRole)) {
    navItems.push({
      name: 'Leads',
      path: '/leads',
      icon: 'Target'
    })
  }
  
  // Management routes
  if (['head_teaching', 'head_sales', 'superadmin'].includes(userRole)) {
    navItems.push(
      {
        name: 'Reports',
        path: '/reports',
        icon: 'BarChart3'
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: 'Settings'
      }
    )
  }
  
  return navItems
}
