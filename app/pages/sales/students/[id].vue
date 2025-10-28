<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Edit, Trash2, Phone, Users, Calendar, FileText, Plus, DollarSign, AlertTriangle } from 'lucide-vue-next'
import type { StudentWithTariff } from '~/types/student'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { toast } from 'vue-sonner'
import AddPaymentDialog from '~/components/payments/AddPaymentDialog.vue'

// Page meta
definePageMeta({
  layout: 'dashboard'
})

// Auth and role check
const { profile, hasAnyRole, isProfileLoaded } = useAuth()
const supabase = useSupabaseClient()

// Wait for profile to load before checking access
await until(isProfileLoaded).toBe(true)

// Check if user has access (sales or head_sales only)
if (!hasAnyRole(['sales', 'head_sales'])) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Sales role required.'
  })
}

// Get student ID from route
const route = useRoute()
const studentId = route.params.id as string

// Reactive state
const student = ref<StudentWithTariff | null>(null)
const payments = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const tariffs = ref<Array<{ id: string; name: string }>>([])
const tariffPrices = ref<Array<{ id: string; name: string; tariff_id: string; price: number }>>([])
const isUpdating = ref(false)
const showPaymentDialog = ref(false)

// Fetch student details and payments
const fetchStudent = async () => {
  if (!profile.value?.id || !studentId) return
  
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch student details
    const { data: studentData, error: fetchError } = await (supabase as any)
      .from('students')
      .select(`
        *,
        tariff:tariffs(id, name),
        tariff_price:tariff_prices(id, name, price)
      `)
      .eq('id', studentId)
      .eq('manager_id', profile.value.id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Student not found or access denied.'
        })
      }
      throw fetchError
    }
    
    // Fetch payments
    const { data: paymentsData } = await (supabase as any)
      .from('student_payments')
      .select('id, amount, payment_date, payment_type, receipt_url, created_at')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })
    
    // Fetch tariffs and prices for edit modal
    const { data: tariffsData } = await supabase
      .from('tariffs')
      .select('id, name')
      .order('name')
    
    const { data: pricesData } = await supabase
      .from('tariff_prices')
      .select('id, name, tariff_id, price')
      .order('name')
    
    student.value = studentData
    payments.value = paymentsData || []
    tariffs.value = tariffsData || []
    tariffPrices.value = pricesData || []
  } catch (err: any) {
    console.error('Error fetching student:', err)
    if (err.statusCode) {
      throw err
    }
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student details'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to load student data', {
      description: errorMessage
    })
  } finally {
    isLoading.value = false
  }
}

// Edit form state
const editForm = ref({
  full_name: '',
  phone: '',
  group_code: '',
  tariff_id: '',
  tariff_price_id: '',
  notes: ''
})

// Computed filtered tariff prices for edit modal
const filteredEditTariffPrices = computed(() => {
  if (!editForm.value.tariff_id) return []
  return tariffPrices.value.filter(price => price.tariff_id === editForm.value.tariff_id)
})

// Open edit modal with current student data
const openEditModal = () => {
  if (!student.value) return
  
  editForm.value = {
    full_name: student.value.full_name,
    phone: student.value.phone,
    group_code: student.value.group_code,
    tariff_id: student.value.tariff_id,
    tariff_price_id: student.value.tariff_price_id,
    notes: student.value.notes || ''
  }
  showEditModal.value = true
}

// Handle tariff change in edit form
const handleEditTariffChange = () => {
  editForm.value.tariff_price_id = ''
}

// Update student
const updateStudent = async () => {
  if (!student.value || !editForm.value.full_name.trim()) return
  
  try {
    isUpdating.value = true
    
    const { error: updateError } = await (supabase as any)
      .from('students')
      .update({
        full_name: editForm.value.full_name.trim(),
        phone: editForm.value.phone.trim(),
        group_code: editForm.value.group_code.trim(),
        tariff_id: editForm.value.tariff_id,
        tariff_price_id: editForm.value.tariff_price_id,
        notes: editForm.value.notes.trim() || null
      })
      .eq('id', studentId)
      .eq('manager_id', profile.value?.id)
    
    if (updateError) {
      throw updateError
    }
    
    // Show success toast
    toast.success('Student updated successfully', {
      description: `${editForm.value.full_name}'s information has been updated`
    })
    
    // Refresh student data
    await fetchStudent()
    showEditModal.value = false
  } catch (err) {
    console.error('Error updating student:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to update student'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to update student', {
      description: errorMessage
    })
  } finally {
    isUpdating.value = false
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format price for display
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format phone number
const formatPhone = (phone: string) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  // Format as +998 XX XXX XX XX
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`
  }
  return phone
}

// Calculate debt amount
const debtAmount = computed(() => {
  if (!student.value?.tariff_price) return 0
  
  const monthlyFee = student.value.tariff_price.price
  const totalPaid = payments.value.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Calculate months since registration
  const registrationDate = new Date(student.value.created_at)
  const currentDate = new Date()
  const monthsDiff = Math.max(1, Math.floor((currentDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  
  const totalOwed = monthlyFee * monthsDiff
  return Math.max(0, totalOwed - totalPaid)
})

// Navigation functions
const goBack = () => {
  navigateTo('/sales/students')
}

// Format price for display in edit modal
const formatPriceForEdit = (price: number) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format payment type for display
const formatPaymentType = (type: string) => {
  const types: Record<string, string> = {
    'cash': 'Cash',
    'card': 'Card',
    'bank_transfer': 'Bank Transfer',
    'online': 'Online Payment'
  }
  return types[type] || type
}

// Load student on mount
onMounted(() => {
  fetchStudent()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          @click="goBack"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Student Details</h1>
          <p class="text-gray-600">View and manage student information</p>
        </div>
      </div>
      <div v-if="student">
        <button
          @click="openEditModal"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <Edit class="mr-2 h-4 w-4" />
          Edit Student
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button
            @click="fetchStudent"
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

    <!-- Student Details -->
    <div v-else-if="student && !error" class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Student Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ student.full_name }}</h2>
            <p class="text-sm text-gray-500 mt-1">Student ID: {{ student.student_code }}</p>
          </div>
          <span class="text-xs text-gray-400">Registered {{ formatDate(student.created_at) }}</span>
        </div>
      </div>

      <!-- Student Information -->
      <div class="px-6 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Basic Info -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
            <div class="space-y-2">
              <div class="flex items-center text-sm">
                <Phone class="h-4 w-4 text-gray-400 mr-2" />
                <span class="text-gray-900">{{ formatPhone(student.phone) }}</span>
              </div>
            </div>
          </div>

          <!-- Academic Info -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-3">Academic Details</h3>
            <div class="space-y-2">
              <div class="flex items-center text-sm">
                <Users class="h-4 w-4 text-gray-400 mr-2" />
                <span class="text-gray-900">Group {{ student.group_code }}</span>
              </div>
            </div>
          </div>

          <!-- Tariff Info -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-3">Tariff & Pricing</h3>
            <div class="space-y-2">
              <div v-if="student.tariff && student.tariff_price" class="text-sm">
                <div class="text-gray-900 font-medium">{{ student.tariff.name }} - {{ student.tariff_price.name }}</div>
                <div class="font-semibold text-green-600">{{ formatPrice(student.tariff_price.price) }}</div>
              </div>
              <div v-else-if="student.tariff" class="text-sm">
                <div class="text-gray-900 font-medium">{{ student.tariff.name }}</div>
                <div class="text-yellow-600">No price plan assigned</div>
              </div>
              <div v-else class="text-sm">
                <div class="text-gray-400">No tariff assigned</div>
              </div>
            </div>
          </div>

          <!-- Balance Info -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-3">Account Balance</h3>
            <div class="space-y-1">
              <div class="text-lg font-semibold" :class="debtAmount > 0 ? 'text-red-600' : 'text-green-600'">
                {{ debtAmount > 0 ? formatPrice(debtAmount) : 'Paid up' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ debtAmount > 0 ? 'Amount owed' : 'All payments current' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div v-if="student.notes" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Notes</h3>
          <p class="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{{ student.notes }}</p>
        </div>

        <!-- Payment History Section -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-gray-500">Payment History</h3>
            <button
              @click="showPaymentDialog = true"
              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Plus class="h-3 w-3 mr-1" />
              Add Payment
            </button>
          </div>
          
          <!-- No Payments State -->
          <div v-if="payments.length === 0" class="text-center py-8">
            <FileText class="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-500">No payment records found</p>
            <button
              @click="showPaymentDialog = true"
              class="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Record first payment
            </button>
          </div>
          
          <!-- Payments List -->
          <div v-else class="space-y-3">
            <div 
              v-for="payment in payments" 
              :key="payment.id"
              class="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <DollarSign class="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {{ formatPrice(payment.amount) }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ formatDate(payment.payment_date) }} • {{ formatPaymentType(payment.payment_type) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <a 
                    v-if="payment.receipt_url"
                    :href="payment.receipt_url"
                    target="_blank"
                    class="text-blue-600 hover:text-blue-700 text-xs underline"
                  >
                    View Receipt
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Student Modal -->
    <Dialog :open="showEditModal" @update:open="showEditModal = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        
        <form @submit.prevent="updateStudent" class="space-y-4">
          <!-- Full Name -->
          <div class="space-y-2">
            <label for="edit-full-name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Full Name *
            </label>
            <Input
              id="edit-full-name"
              v-model="editForm.full_name"
              type="text"
              required
            />
          </div>

          <!-- Phone -->
          <div class="space-y-2">
            <label for="edit-phone" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Phone Number *
            </label>
            <Input
              id="edit-phone"
              v-model="editForm.phone"
              type="tel"
              required
            />
          </div>

          <!-- Group Code -->
          <div class="space-y-2">
            <label for="edit-group-code" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Group Code *
            </label>
            <Input
              id="edit-group-code"
              v-model="editForm.group_code"
              type="text"
              required
            />
          </div>

          <!-- Tariff Selection -->
          <div class="space-y-2">
            <label for="edit-tariff" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tariff *
            </label>
            <Select v-model="editForm.tariff_id" @update:model-value="handleEditTariffChange">
              <SelectTrigger id="edit-tariff" class="h-10">
                <SelectValue placeholder="Select a tariff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tariff in tariffs" :key="tariff.id" :value="tariff.id">
                  {{ tariff.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Tariff Price Selection -->
          <div class="space-y-2">
            <label for="edit-price" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Price Plan *
            </label>
            <Select v-model="editForm.tariff_price_id" :disabled="!editForm.tariff_id">
              <SelectTrigger id="edit-price" class="h-10">
                <SelectValue placeholder="Select a price plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="price in filteredEditTariffPrices" :key="price.id" :value="price.id">
                  {{ price.name }} - {{ formatPriceForEdit(price.price) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Notes -->
          <div class="space-y-2">
            <label for="edit-notes" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Notes
            </label>
            <textarea
              id="edit-notes"
              v-model="editForm.notes"
              rows="3"
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Additional notes about the student"
            ></textarea>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="showEditModal = false"
              :disabled="isUpdating"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="isUpdating"
            >
              {{ isUpdating ? 'Updating...' : 'Update Student' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Add Payment Dialog -->
    <AddPaymentDialog
      v-model:open="showPaymentDialog"
      :student-id="studentId"
      :student-name="student?.full_name || 'Student'"
      @payment-added="fetchStudent"
    />
  </div>
</template>
