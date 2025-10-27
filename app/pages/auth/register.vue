<script setup lang="ts">
import type { UserRole } from '~/types/role'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { register, isLoading, error, isAuthenticated } = useAuth()
import { toast } from 'vue-sonner'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const selectedRole = ref<UserRole>('teacher')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const availableRoles: { value: UserRole; label: string }[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'sales', label: 'Sales' },
  { value: 'head_teaching', label: 'Head of Teaching' },
  { value: 'head_sales', label: 'Head of Sales' }
]

const formError = ref<string | null>(null)

watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})

const validateForm = () => {
  formError.value = null
  
  if (!email.value || !password.value || !fullName.value) {
    formError.value = 'All fields are required'
    return false
  }
  
  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match'
    return false
  }
  
  if (password.value.length < 6) {
    formError.value = 'Password must be at least 6 characters long'
    return false
  }
  
  return true
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  const result = await register(email.value, password.value, fullName.value, selectedRole.value)
  
  if (result.success) {
    toast('Account created! Redirecting to approval status...', {
      icon: h(CheckCircle, { class: 'text-green-500' })
    })
    // Redirect to login page since user needs to sign in first
    await navigateTo('/auth/login')
  } else {
    toast.error(result.error || 'Registration failed', {
      icon: h(XCircle, { class: 'text-red-500' })
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <img class="mx-auto h-12 w-auto" src="/logo.png" alt="Razgovor" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Already have an account?
          <NuxtLink to="/auth/login" class="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </NuxtLink>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Select v-model="selectedRole">
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in availableRoles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                class="pr-10"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div class="relative">
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your password"
                class="pr-10"
                required
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="formError || error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p class="text-sm">{{ formError || error }}</p>
        </div>

        <div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <p class="text-sm">
            Your account will need to be approved by a superadmin before you can access the system.
          </p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span v-if="!isLoading">Create Account</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>
