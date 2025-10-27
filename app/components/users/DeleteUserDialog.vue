<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface UserProfile {
  id: string
  email: string
  full_name?: string
}

interface Props {
  open: boolean
  user: UserProfile | null
  isDeleting: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const handleOpenChange = (open: boolean) => {
  emit('update:open', open)
  // Don't automatically emit cancel when dialog closes
  // Let the parent handle cleanup explicitly
}
</script>

<template>
  <AlertDialog :open="open" @update:open="handleOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete User</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <strong>{{ user?.full_name || user?.email }}</strong>? 
          This action cannot be undone and will permanently remove the user from both the database and authentication system.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('cancel')">Cancel</AlertDialogCancel>
        <AlertDialogAction 
          @click="emit('confirm')" 
          class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          :disabled="isDeleting"
        >
          <span v-if="isDeleting" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          </span>
          <span v-else>Delete User</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
