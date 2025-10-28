<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search, Eye, Edit, Trash2, GraduationCap } from 'lucide-vue-next'
import type { Student, StudentWithTariff } from '~/types/student'
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
        tariff_price:tariff_prices(id, name, price)
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

// Delete student
const deleteStudent = async (studentId: string) => {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
    return
  }
  
  try {
    const { error: deleteError } = await (supabase as any)
      .from('students')
      .delete()
      .eq('id', studentId)
    
    if (deleteError) {
      throw deleteError
    }
    
    // Remove from local state
    const deletedStudent = students.value.find(s => s.id === studentId)
    students.value = students.value.filter(s => s.id !== studentId)
    
    // Show success toast
    toast.success('Student deleted successfully', {
      description: deletedStudent ? `${deletedStudent.full_name} has been removed` : 'Student has been removed'
    })
  } catch (err) {
    console.error('Error deleting student:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete student'
    error.value = errorMessage
    
    // Show error toast
    toast.error('Failed to delete student', {
      description: errorMessage
    })
  }
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

// Navigate to add student page
const navigateToAddStudent = () => {
  navigateTo('/students/add')
}

// Load students on mount
onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Students</h1>
        <p class="text-gray-600">Manage your assigned students</p>
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
    <div v-else-if="!error" class="bg-white shadow overflow-hidden sm:rounded-md">
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

      <!-- Students List -->
      <ul v-else class="divide-y divide-gray-200">
        <li v-for="student in filteredStudents" :key="student.id" class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span class="text-sm font-medium text-blue-600">
                      {{ student.full_name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ student.full_name }}
                    </p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {{ student.student_code }}
                    </span>
                  </div>
                  <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>📞 {{ student.phone }}</span>
                    <span>👥 {{ student.group_code }}</span>
                    <span v-if="student.tariff">💰 {{ student.tariff.name }}</span>
                    <span v-if="student.tariff_price">
                      ({{ student.tariff_price.name }} - {{ formatPrice(student.tariff_price.price) }})
                    </span>
                  </div>
                  <p v-if="student.notes" class="mt-1 text-sm text-gray-500 truncate">
                    📝 {{ student.notes }}
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">
                {{ formatDate(student.created_at) }}
              </span>
              <div class="flex items-center space-x-1">
                <button
                  @click="navigateTo(`/students/${student.id}`)"
                  class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="View Details"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  @click="navigateTo(`/students/${student.id}/edit`)"
                  class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Edit Student"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  @click="deleteStudent(student.id)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Student"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
