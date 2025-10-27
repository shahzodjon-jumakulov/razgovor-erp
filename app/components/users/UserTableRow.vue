<script setup lang="ts">
import type { UserRole } from '~/types/role'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import { TableCell, TableRow } from '~/components/ui/table'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: UserRole
  is_approved: boolean
  created_at: string
  sales_id?: string
}

interface Props {
  user: UserProfile
  currentUserId?: string
  isDeleting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleApproval: [userId: string, currentStatus: boolean]
  updateSalesId: [userId: string, salesId: string]
  deleteUser: [user: UserProfile]
}>()

// Role badge variants mapping
const getRoleVariant = (role: UserRole) => {
  const variants = {
    superadmin: 'destructive',
    head_sales: 'default',
    sales: 'secondary',
    head_teaching: 'info',
    teacher: 'success'
  } as const
  return variants[role] || 'outline'
}

// Format role display name
const formatRole = (role: UserRole) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const isCurrentUser = computed(() => props.user.id === props.currentUserId)

// Sales ID editing state
const isEditingSalesId = ref(false)
const editingSalesId = ref('')

// Template ref for input
const salesIdInput = ref<HTMLInputElement | null>(null)

// Start editing sales ID
const startEditingSalesId = () => {
  editingSalesId.value = props.user.sales_id || ''
  isEditingSalesId.value = true
  nextTick(() => {
    salesIdInput.value?.focus()
    salesIdInput.value?.select()
  })
}

// Save sales ID
const saveSalesId = () => {
  emit('updateSalesId', props.user.id, editingSalesId.value)
  isEditingSalesId.value = false
}

// Cancel editing sales ID
const cancelEditingSalesId = () => {
  isEditingSalesId.value = false
  editingSalesId.value = ''
}

// Handle Enter key to save
const handleSalesIdKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    saveSalesId()
  } else if (event.key === 'Escape') {
    cancelEditingSalesId()
  }
}
</script>

<template>
  <TableRow>
    <TableCell class="font-medium">
      {{ user.full_name || 'No name set' }}
    </TableCell>
    <TableCell>{{ user.email }}</TableCell>
    <TableCell>
      <Badge :variant="getRoleVariant(user.role)">
        {{ formatRole(user.role) }}
      </Badge>
    </TableCell>
    <TableCell>
      <!-- Sales ID - only show for sales role -->
      <div v-if="user.role === 'sales'" class="min-w-[120px]">
        <div v-if="!isEditingSalesId" class="flex items-center gap-2">
          <span class="text-sm">{{ user.sales_id || 'Not set' }}</span>
          <button
            @click="startEditingSalesId"
            class="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
            title="Edit Sales ID"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        <div v-else class="flex items-center gap-1">
          <input
            v-model="editingSalesId"
            @keydown="handleSalesIdKeydown"
            @blur="saveSalesId"
            class="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Sales ID"
            maxlength="10"
            ref="salesIdInput"
          />
          <button
            @click="saveSalesId"
            class="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
            title="Save"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            @click="cancelEditingSalesId"
            class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            title="Cancel"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div v-else class="text-sm text-gray-400">-</div>
    </TableCell>
    <TableCell>
      <span 
        :class="[
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          user.is_approved 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        ]"
      >
        {{ user.is_approved ? 'Approved' : 'Pending' }}
      </span>
    </TableCell>
    <TableCell>
      <Switch 
        :model-value="user.is_approved"
        @update:model-value="emit('toggleApproval', user.id, user.is_approved)"
        :disabled="isCurrentUser"
      />
    </TableCell>
    <TableCell>
      <Button
        variant="destructive"
        size="sm"
        @click="emit('deleteUser', user)"
        :disabled="isCurrentUser || isDeleting"
        class="text-xs"
      >
        <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </Button>
    </TableCell>
  </TableRow>
</template>
