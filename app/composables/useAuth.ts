import type { UserRole } from '~/types/role'

// Global state for auth (singleton pattern)
const globalAuthState = {
  isLoading: ref(false),
  error: ref<string | null>(null),
  profile: ref<{
    id: string
    email: string
    role: UserRole
    full_name?: string
    is_approved: boolean
  } | null>(null),
  isInitialized: ref(false),
  isFetching: ref(false)
}

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Login function
  const login = async (email: string, password: string) => {
    try {
      globalAuthState.isLoading.value = true
      globalAuthState.error.value = null
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        globalAuthState.error.value = authError.message
        return { success: false, error: authError.message }
      }
      
      // Fetch user profile after successful login
      if (data.user) {
        const profile = await fetchProfile()
        
        // Check approval status and return it with the result
        const isApproved = profile?.is_approved ?? false
        return { 
          success: true, 
          user: data.user, 
          isApproved,
          profile 
        }
      }
      
      return { success: true, user: data.user }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      globalAuthState.error.value = message
      return { success: false, error: message }
    } finally {
      globalAuthState.isLoading.value = false
    }
  }

  // Register function
  const register = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      globalAuthState.isLoading.value = true
      globalAuthState.error.value = null
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            full_name: fullName,
          },
        },
      })
      
      if (authError) {
        globalAuthState.error.value = authError.message
        return { success: false, error: authError.message }
      }
      
      return { success: true, user: data.user }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      globalAuthState.error.value = message
      return { success: false, error: message }
    } finally {
      globalAuthState.isLoading.value = false
    }
  }

  // Logout function
  const logout = async () => {
    try {
      globalAuthState.isLoading.value = true
      globalAuthState.error.value = null
      
      const { error: authError } = await supabase.auth.signOut()
      
      if (authError) {
        globalAuthState.error.value = authError.message
        return { success: false, error: authError.message }
      }
      
      // Clear profile data
      globalAuthState.profile.value = null
      globalAuthState.isInitialized.value = false
      
      // Navigate to login
      await navigateTo('/auth/login')
      
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      globalAuthState.error.value = message
      return { success: false, error: message }
    } finally {
      globalAuthState.isLoading.value = false
    }
  }

  // Fetch user profile with caching
  const fetchProfile = async (force = false) => {
    if (!user.value) return
    
    // Prevent multiple simultaneous fetches
    if (globalAuthState.isFetching.value && !force) return
    
    // Return cached profile if already loaded and not forcing refresh
    if (globalAuthState.profile.value && globalAuthState.isInitialized.value && !force) {
      return globalAuthState.profile.value
    }
    
    try {
      globalAuthState.isFetching.value = true
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, is_approved')
        .eq('id', user.value.sub)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
      }
      
      globalAuthState.profile.value = data
      globalAuthState.isInitialized.value = true
      return data
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      globalAuthState.isFetching.value = false
    }
  }

  // Check if user has specific role
  const hasRole = (role: UserRole): boolean => {
    return globalAuthState.profile.value?.role === role
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return globalAuthState.profile.value ? roles.includes(globalAuthState.profile.value.role) : false
  }

  // Check if user is approved
  const isApproved = computed(() => {
    return globalAuthState.profile.value?.is_approved ?? false
  })

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => globalAuthState.profile.value?.role || null)
  const isProfileLoaded = computed(() => globalAuthState.isInitialized.value)

  // Delete user function (admin only)
  const deleteUser = async (userId: string) => {
    try {
      globalAuthState.isLoading.value = true
      globalAuthState.error.value = null
      
      // Then delete from Supabase auth (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        globalAuthState.error.value = authError.message
        return { success: false, error: authError.message }
      }
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      globalAuthState.error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      globalAuthState.isLoading.value = false
    }
  }

  // Initialize profile fetch only once per user session
  if (!globalAuthState.isInitialized.value) {
    watch(user, async (newUser) => {
      if (newUser && !globalAuthState.isInitialized.value) {
        await fetchProfile()
      } else if (!newUser) {
        globalAuthState.profile.value = null
        globalAuthState.isInitialized.value = false
      }
    }, { immediate: true })
  }

  return {
    // State
    user: readonly(user),
    profile: readonly(globalAuthState.profile),
    isLoading: readonly(globalAuthState.isLoading),
    error: readonly(globalAuthState.error),
    isAuthenticated,
    isApproved,
    isProfileLoaded,
    userRole,
    
    // Methods
    login,
    register,
    logout,
    fetchProfile,
    deleteUser,
    hasRole,
    hasAnyRole
  }
}
