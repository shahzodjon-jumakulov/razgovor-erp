<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Save } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { toast } from 'vue-sonner'

// Page meta
definePageMeta({
  layout: 'dashboard'
})

// Auth and role check
const { profile, hasAnyRole } = useAuth()
const supabase = useSupabaseClient()

// Check if user has access (sales or head_sales only)
if (!hasAnyRole(['sales', 'head_sales'])) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Sales role required.'
  })
}

// Form state
const form = ref({
  full_name: '',
  phone: '',
  tariff_id: '',
  tariff_price_id: '',
  group_code: '',
  notes: ''
})

// Loading and error states
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Tariffs and prices data
const tariffs = ref<Array<{ id: string; name: string }>>([])
const tariffPrices = ref<Array<{ id: string; name: string; tariff_id: string; discount: number }>>([])

// Computed filtered tariff prices based on selected tariff
const filteredTariffPrices = computed(() => {
  if (!form.value.tariff_id) return []
  return tariffPrices.value.filter(price => price.tariff_id === form.value.tariff_id)
})

// Form validation
const isFormValid = computed(() => {
  return form.value.full_name.trim() !== '' &&
         form.value.phone.trim() !== '' &&
         form.value.tariff_id !== '' &&
         form.value.tariff_price_id !== '' &&
         form.value.group_code.trim() !== ''
})

// Fetch tariffs and prices
const fetchTariffsAndPrices = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch tariffs
    const { data: tariffsData, error: tariffsError } = await supabase
      .from('tariffs')
      .select('id, name')
      .order('name')
    
    if (tariffsError) throw tariffsError
    
    // Fetch tariff prices
    const { data: pricesData, error: pricesError } = await supabase
      .from('tariff_prices')
      .select('id, name, tariff_id, discount')
      .order('name')
    
    if (pricesError) throw pricesError
    
    tariffs.value = tariffsData || []
    tariffPrices.value = pricesData || []
  } catch (err) {
    console.error('Error fetching tariffs and prices:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tariffs and prices'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to load data', {
      description: errorMessage
    })
  } finally {
    isLoading.value = false
  }
}

// Handle tariff change - reset tariff price selection
const handleTariffChange = () => {
  form.value.tariff_price_id = ''
}

// Submit form
const submitForm = async () => {
  if (!isFormValid.value || !profile.value?.id) return
  
  try {
    isSubmitting.value = true
    error.value = null
    
    const { data, error: insertError } = await (supabase as any)
      .from('students')
      .insert({
        manager_id: profile.value.id,
        full_name: form.value.full_name.trim(),
        phone: form.value.phone.trim(),
        tariff_id: form.value.tariff_id,
        tariff_price_id: form.value.tariff_price_id,
        group_code: form.value.group_code.trim(),
        notes: form.value.notes.trim() || null
      })
      .select()
    
    if (insertError) throw insertError
    
    // Show success toast
    toast.success('Student created successfully', {
      description: `${form.value.full_name} has been added to the system`
    })
    
    // Navigate back to students list
    await navigateTo('/students')
  } catch (err) {
    console.error('Error creating student:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to create student'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to create student', {
      description: errorMessage
    })
  } finally {
    isSubmitting.value = false
  }
}

// Navigate back
const goBack = () => {
  navigateTo('/students')
}

// Load data on mount
onMounted(() => {
  fetchTariffsAndPrices()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center space-x-4">
      <button
        @click="goBack"
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Add New Student</h1>
        <p class="text-gray-600">Create a new student record</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button
            v-if="!isSubmitting"
            @click="fetchTariffsAndPrices"
            class="mt-2 text-sm text-red-600 hover:text-red-500 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Form -->
    <div v-else-if="!error" class="bg-white shadow rounded-lg">
      <form @submit.prevent="submitForm" class="space-y-6 p-6">
        <!-- Student Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900">Student Information</h3>
          
          <!-- Full Name -->
          <div>
            <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              id="full_name"
              v-model="form.full_name"
              type="text"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter student's full name"
            />
          </div>

          <!-- Phone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <!-- Group Code -->
          <div>
            <label for="group_code" class="block text-sm font-medium text-gray-700 mb-1">
              Group Code *
            </label>
            <input
              id="group_code"
              v-model="form.group_code"
              type="text"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter group code (e.g., A1, B2, etc.)"
            />
          </div>
        </div>

        <!-- Tariff Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900">Tariff Information</h3>
          
          <!-- Tariff Selection -->
          <div>
            <label for="tariff_id" class="block text-sm font-medium text-gray-700 mb-1">
              Tariff *
            </label>
            <select
              id="tariff_id"
              v-model="form.tariff_id"
              @change="handleTariffChange"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a tariff</option>
              <option v-for="tariff in tariffs" :key="tariff.id" :value="tariff.id">
                {{ tariff.name }}
              </option>
            </select>
          </div>

          <!-- Tariff Price Selection -->
          <div>
            <label for="tariff_price_id" class="block text-sm font-medium text-gray-700 mb-1">
              Price Plan *
            </label>
            <select
              id="tariff_price_id"
              v-model="form.tariff_price_id"
              required
              :disabled="!form.tariff_id"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a price plan</option>
              <option v-for="price in filteredTariffPrices" :key="price.id" :value="price.id">
                {{ price.name }} ({{ price.discount }}% discount)
              </option>
            </select>
            <p v-if="!form.tariff_id" class="mt-1 text-sm text-gray-500">
              Please select a tariff first
            </p>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              rows="3"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes about the student (optional)"
            ></textarea>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="goBack"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save class="mr-2 h-4 w-4" />
            {{ isSubmitting ? 'Creating...' : 'Create Student' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
