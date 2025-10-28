<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search, ArrowLeft, GraduationCap } from 'lucide-vue-next'
import type { Student, StudentWithTariff } from '~/types/student'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { toast } from 'vue-sonner'

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

// Reactive state
const students = ref<StudentWithTariff[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Filtered students based on search
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student => 
    student.full_name.toLowerCase().includes(query) ||
    student.student_code.toLowerCase().includes(query) ||
    student.phone.includes(query) ||
    student.group_code.toLowerCase().includes(query)
  )
})

// Fetch students for current sales manager
const fetchStudents = async () => {
  if (!profile.value?.id) return
  
  try {
    isLoading.value = true
    error.value = null
    
    const { data, error: fetchError } = await (supabase as any)
      .from('students')
      .select(`
        *,
        tariff:tariffs(id, name),
        tariff_price:tariff_prices(id, name, price),
        student_payments(amount)
      `)
      .eq('manager_id', profile.value.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      throw fetchError
    }
    
    students.value = data || []
  } catch (err) {
    console.error('Error fetching students:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to load students', {
      description: errorMessage
    })
  } finally {
    isLoading.value = false
  }
}

// Navigate to student detail
const viewStudent = (studentId: string) => {
  navigateTo(`/sales/students/${studentId}`)
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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

// Calculate amount owed for a student
const calculateAmountOwed = (student: any) => {
  const tariffPrice = student.tariff_price?.price || 0
  const totalPaid = student.student_payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0
  return Math.max(0, tariffPrice - totalPaid)
}

// Get badge variant based on amount owed
const getOwedBadgeVariant = (amountOwed: number) => {
  if (amountOwed === 0) return 'default' // Paid in full
  if (amountOwed > 0) return 'destructive' // Amount owed
  return 'secondary' // Fallback
}

// Get badge text based on amount owed
const getOwedBadgeText = (amountOwed: number) => {
  if (amountOwed === 0) return 'Paid'
  return 'Owes'
}

// Navigate to add student page
const navigateToAddStudent = () => {
  navigateTo('/sales/students/add')
}

// Navigate back to sales dashboard
const goBackToSales = () => {
  navigateTo('/sales')
}

// Load students on mount
onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          @click="goBackToSales"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Students</h1>
          <p class="text-gray-600">Manage your assigned students</p>
        </div>
      </div>
      <button
        @click="navigateToAddStudent"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus class="mr-2 h-4 w-4" />
        Add Student
      </button>
    </div>

    <!-- Search -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search class="h-5 w-5 text-gray-400" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search students by name, code, phone, or group..."
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button
            @click="fetchStudents"
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

    <!-- Students Table -->
    <div v-else-if="!error" class="bg-white shadow rounded-lg">
      <!-- Empty State -->
      <div v-if="filteredStudents.length === 0 && !searchQuery" class="text-center py-12">
        <GraduationCap class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No students</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by adding your first student.</p>
        <div class="mt-6">
          <button
            @click="navigateToAddStudent"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="mr-2 h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      <!-- No Search Results -->
      <div v-else-if="filteredStudents.length === 0 && searchQuery" class="text-center py-12">
        <Search class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No results found</h3>
        <p class="mt-1 text-sm text-gray-500">No students match your search criteria.</p>
      </div>

      <!-- Students Table -->
      <div v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Tariff</TableHead>
              <TableHead>Amount Owed</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="student in filteredStudents" 
              :key="student.id"
              @click="viewStudent(student.id)"
              class="cursor-pointer hover:bg-gray-50"
            >
              <TableCell>
                <div class="flex items-center space-x-2">
                  <div>
                    <div class="font-medium text-gray-900">{{ student.full_name }}</div>
                    <div class="text-sm text-gray-500">{{ student.student_code }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-gray-900">{{ student.phone }}</TableCell>
              <TableCell class="text-gray-900">{{ student.group_code }}</TableCell>
              <TableCell>
                <div v-if="student.tariff" class="text-gray-900">
                  <div>{{ student.tariff.name }}</div>
                  <div v-if="student.tariff_price" class="text-sm text-gray-500">
                    {{ student.tariff_price.name }} - {{ formatPrice(student.tariff_price.price) }}
                  </div>
                </div>
                <span v-else class="text-gray-400">Not assigned</span>
              </TableCell>
              <TableCell>
                <div class="flex items-center space-x-2">
                  <Badge 
                    :variant="getOwedBadgeVariant(calculateAmountOwed(student))"
                    class="text-xs"
                  >
                    {{ getOwedBadgeText(calculateAmountOwed(student)) }}
                  </Badge>
                  <span 
                    v-if="calculateAmountOwed(student) > 0" 
                    class="text-sm font-medium text-red-600"
                  >
                    {{ formatPrice(calculateAmountOwed(student)) }}
                  </span>
                  <span 
                    v-else 
                    class="text-sm text-green-600 font-medium"
                  >
                    ✓ Paid
                  </span>
                </div>
              </TableCell>
              <TableCell class="text-gray-500">{{ formatDate(student.created_at) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
