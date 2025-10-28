<script setup lang="ts">
import { GraduationCap, DollarSign } from 'lucide-vue-next'

// Page meta
definePageMeta({
  layout: 'dashboard'
})

// Auth and role check
const { hasAnyRole, isProfileLoaded, profile } = useAuth()

// Wait for profile to load before checking access
await until(isProfileLoaded).toBe(true)

// Check if user has access (sales or head_sales only)
if (!hasAnyRole(['sales', 'head_sales'])) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Sales role required.'
  })
}


// Navigation functions
const navigateToStudents = () => {
  navigateTo('/sales/students')
}

const navigateToAddStudent = () => {
  navigateTo('/sales/students/add')
}

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
      <p class="text-gray-600">Manage your students and track your performance</p>
    </div>


    <!-- Quick Actions -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- View Students -->
          <button
            @click="navigateToStudents"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <GraduationCap class="h-8 w-8 text-blue-600 mr-4" />
            <div class="text-left">
              <h4 class="text-sm font-medium text-gray-900">View Students</h4>
              <p class="text-sm text-gray-500">Manage your student list</p>
            </div>
          </button>

          <!-- Add Student -->
          <button
            @click="navigateToAddStudent"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span class="text-green-600 font-bold text-lg">+</span>
            </div>
            <div class="text-left">
              <h4 class="text-sm font-medium text-gray-900">Add Student</h4>
              <p class="text-sm text-gray-500">Register a new student</p>
            </div>
          </button>

          <!-- View Payments (Future) -->
          <button
            disabled
            class="flex items-center p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
          >
            <DollarSign class="h-8 w-8 text-gray-400 mr-4" />
            <div class="text-left">
              <h4 class="text-sm font-medium text-gray-500">View Payments</h4>
              <p class="text-sm text-gray-400">Coming soon</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Activity (Future Enhancement) -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div class="p-6">
        <div class="text-center py-8">
          <div class="text-gray-400 mb-2">
            <TrendingUp class="h-12 w-12 mx-auto" />
          </div>
          <h4 class="text-sm font-medium text-gray-500">No recent activity</h4>
          <p class="text-sm text-gray-400">Activity tracking will be available soon</p>
        </div>
      </div>
    </div>
  </div>
</template>
