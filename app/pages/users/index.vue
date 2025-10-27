<script setup lang="ts">
import type { UserRole } from '~/types/role'
import UserTableRow from '~/components/users/UserTableRow.vue'
import DeleteUserDialog from '~/components/users/DeleteUserDialog.vue'
import LoadingState from '~/components/ui/LoadingState.vue'
import ErrorState from '~/components/ui/ErrorState.vue'
import ErrorToast from '~/components/ui/ErrorToast.vue'
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '~/components/ui/table'

// Set layout and meta
definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Users Management'
})

// Check route protection
const { profile, user } = useAuth()

// Admin access check - profile will be automatically loaded by useAuth
if (process.client && profile.value && profile.value.role !== 'superadmin') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access Denied: Admin privileges required.'
  })
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  is_approved: boolean
  created_at: string
  sales_id?: string
}

const supabase = useSupabaseClient()
const { profile: currentUserProfile } = useAuth()

// State
const users = ref<UserProfile[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// Dialog state
const showDeleteDialog = ref(false)
const userToDelete = ref<UserProfile | null>(null)

// Fetch all users
const fetchUsers = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_approved, created_at, sales_id')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      error.value = fetchError.message
      return
    }
    
    users.value = data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch users'
  } finally {
    isLoading.value = false
  }
}

// Toggle user approval status
const toggleApproval = async (userId: string, currentStatus: boolean) => {
  try {
    const newStatus = !currentStatus
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ is_approved: newStatus })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error updating approval status:', updateError)
      return
    }
    
    // Update local state
    const userIndex = users.value.findIndex(user => user.id === userId)
    if (userIndex !== -1 && users.value[userIndex]) {
      users.value[userIndex].is_approved = newStatus
    }
  } catch (err) {
    console.error('Error toggling approval:', err)
  }
}

// Update sales ID for sales role users
const updateSalesId = async (userId: string, salesId: string) => {
  try {
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ sales_id: salesId || null })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error updating sales ID:', updateError)
      return
    }
    
    // Update local state
    const userIndex = users.value.findIndex(user => user.id === userId)
    if (userIndex !== -1 && users.value[userIndex]) {
      users.value[userIndex].sales_id = salesId || undefined
    }
  } catch (err) {
    console.error('Error updating sales ID:', err)
  }
}

// Show delete confirmation dialog
const confirmDeleteUser = (user: UserProfile) => {
  console.log('confirmDeleteUser called with user:', user)
  userToDelete.value = user
  showDeleteDialog.value = true
  deleteError.value = null
}

// Handle user deletion
const handleDeleteUser = async () => {
  console.log('handleDeleteUser called, userToDelete:', userToDelete.value)
  if (!userToDelete.value) return
  
  try {
    isDeleting.value = true
    deleteError.value = null
    
    console.log('Making API call to delete user:', userToDelete.value.id)
    
    // Call the server API endpoint
    const result = await $fetch('/api/admin/users/delete', {
      method: 'POST',
      body: {
        userId: userToDelete.value.id
      }
    })
    
    console.log('API call successful:', result)
    
    // Remove user from local state on success
    users.value = users.value.filter(user => user.id !== userToDelete.value!.id)
    
    // Close dialog and cleanup
    showDeleteDialog.value = false
    userToDelete.value = null
  } catch (err: any) {
    console.error('Error deleting user:', err)
    deleteError.value = err?.data?.message || err?.message || 'Failed to delete user'
  } finally {
    isDeleting.value = false
  }
}

// Cancel delete operation
const cancelDelete = () => {
  showDeleteDialog.value = false
  userToDelete.value = null
  deleteError.value = null
}

// Load users on mount
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Users Management</h1>
      <p class="mt-1 text-sm text-gray-600">Manage user accounts and permissions</p>
    </div>

    <!-- Loading State -->
    <LoadingState v-if="isLoading" />

    <!-- Error State -->
    <ErrorState 
      v-else-if="error" 
      title="Error Loading Users"
      :message="error"
      @retry="fetchUsers"
    />

    <!-- Users Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">
          All Users ({{ users.length }})
        </h3>
      </div>
      
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sales ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <UserTableRow 
              v-for="user in users" 
              :key="user.id"
              :user="user"
              :current-user-id="currentUserProfile?.id"
              :is-deleting="isDeleting"
              @toggle-approval="toggleApproval"
              @update-sales-id="updateSalesId"
              @delete-user="confirmDeleteUser"
            />
          </TableBody>
        </Table>
        
        <!-- Empty State -->
        <div v-if="users.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p class="mt-1 text-sm text-gray-500">No users have been created yet.</p>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <DeleteUserDialog
      v-model:open="showDeleteDialog"
      :user="userToDelete"
      :is-deleting="isDeleting"
      @confirm="handleDeleteUser"
      @cancel="cancelDelete"
    />


    <!-- Error Toast -->
    <ErrorToast
      :message="deleteError"
      :show="!!deleteError"
      @close="deleteError = null"
    />
  </div>
</template>
