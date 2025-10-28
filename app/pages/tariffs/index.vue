<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCell 
} from '~/components/ui/table'
import { Plus, DollarSign, Package, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import LoadingState from '~/components/ui/LoadingState.vue'
import ErrorState from '~/components/ui/ErrorState.vue'
import AddTariffModal from '~/components/tariffs/AddTariffModal.vue'
import AddTariffPriceModal from '~/components/tariffs/AddTariffPriceModal.vue'

// Set layout and meta
definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Tariffs Management'
})

// Check route protection
const { profile } = useAuth()

// Superadmin access check
if (process.client && profile.value && profile.value.role !== 'superadmin') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access Denied: Superadmin privileges required.'
  })
}

interface Tariff {
  id: string
  name: string
  created_at: string
}

interface TariffPrice {
  id: string
  name: string
  tariff_id: string
  price: number
  created_at: string
}

const supabase = useSupabaseClient()

// State
const tariffs = ref<Tariff[]>([])
const tariffPrices = ref<TariffPrice[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Modal states
const showAddTariffModal = ref(false)
const showAddPriceModal = ref(false)
const isAddingTariff = ref(false)
const isAddingPrice = ref(false)
const preselectedTariffId = ref('')

// All tariffs are always expanded now - no need for expansion state

// Fetch all tariffs
const fetchTariffs = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('tariffs')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      error.value = fetchError.message
      toast.error('Failed to load tariffs', {
        description: fetchError.message
      })
      return
    }
    
    tariffs.value = data || []
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tariffs'
    error.value = errorMessage
    toast.error('Failed to load tariffs', {
      description: errorMessage
    })
  }
}

// Fetch all tariff prices
const fetchTariffPrices = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('tariff_prices')
      .select('id, name, tariff_id, price, created_at')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      error.value = fetchError.message
      toast.error('Failed to load tariff prices', {
        description: fetchError.message
      })
      return
    }
    
    tariffPrices.value = data || []
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tariff prices'
    error.value = errorMessage
    toast.error('Failed to load tariff prices', {
      description: errorMessage
    })
  }
}

// Load all data
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    await Promise.all([fetchTariffs(), fetchTariffPrices()])
  } finally {
    isLoading.value = false
  }
}

// Add new tariff
const addTariff = async (name: string) => {
  try {
    isAddingTariff.value = true
    
    const { data, error: insertError } = await (supabase as any)
      .from('tariffs')
      .insert([{ name }])
      .select()
    
    if (insertError) {
      console.error('Error adding tariff:', insertError)
      toast.error('Failed to create tariff', {
        description: insertError.message || 'An unexpected error occurred'
      })
      return
    }
    
    if (data && data[0]) {
      tariffs.value.unshift(data[0])
      toast.success('Tariff created successfully', {
        description: `"${name}" has been added to your tariffs`
      })
    }
  } catch (err) {
    console.error('Error adding tariff:', err)
    toast.error('Failed to create tariff', {
      description: err instanceof Error ? err.message : 'An unexpected error occurred'
    })
  } finally {
    isAddingTariff.value = false
  }
}

// Open add price modal with preselected tariff
const openAddPriceModal = (tariffId?: string) => {
  preselectedTariffId.value = tariffId || ''
  showAddPriceModal.value = true
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

// Validate price input
const validatePrice = (price: number) => {
  if (isNaN(price) || price <= 0) {
    return 'Price must be a positive number'
  }
  if (price > 999999999999) { // 999 billion limit
    return 'Price is too large'
  }
  return null
}

// Add new tariff price
const addTariffPrice = async (tariffId: string, name: string, price: number) => {
  try {
    isAddingPrice.value = true
    
    // Validate price
    const priceError = validatePrice(price)
    if (priceError) {
      toast.error('Invalid price', {
        description: priceError
      })
      return
    }
    
    // Find tariff name for better toast message
    const tariff = tariffs.value.find(t => t.id === tariffId)
    const tariffName = tariff?.name || 'Unknown Tariff'
    
    const { data, error: insertError } = await (supabase as any)
      .from('tariff_prices')
      .insert([{ 
        name,
        tariff_id: tariffId,
        price
      }])
      .select()
    
    if (insertError) {
      console.error('Error adding tariff price:', insertError)
      toast.error('Failed to add price', {
        description: insertError.message || 'An unexpected error occurred'
      })
      return
    }
    
    if (data && data[0]) {
      tariffPrices.value.unshift(data[0])
      toast.success('Price added successfully', {
        description: `"${name}" (${formatPrice(price)}) added to ${tariffName}`
      })
    }
  } catch (err) {
    console.error('Error adding tariff price:', err)
    toast.error('Failed to add price', {
      description: err instanceof Error ? err.message : 'An unexpected error occurred'
    })
  } finally {
    isAddingPrice.value = false
  }
}

// Get prices for a specific tariff
const getPricesForTariff = (tariffId: string) => {
  return tariffPrices.value.filter(price => price.tariff_id === tariffId)
}

// Removed toggle functionality - all tariffs are always expanded

// Delete tariff
const deleteTariff = async (tariffId: string) => {
  const tariff = tariffs.value.find(t => t.id === tariffId)
  const tariffName = tariff?.name || 'Unknown Tariff'
  
  if (!confirm(`Are you sure you want to delete "${tariffName}"? This will also delete all associated prices.`)) return
  
  try {
    // First delete all associated prices
    await (supabase as any)
      .from('tariff_prices')
      .delete()
      .eq('tariff_id', tariffId)
    
    // Then delete the tariff
    const { error: deleteError } = await (supabase as any)
      .from('tariffs')
      .delete()
      .eq('id', tariffId)
    
    if (deleteError) {
      console.error('Error deleting tariff:', deleteError)
      toast.error('Failed to delete tariff', {
        description: deleteError.message || 'An unexpected error occurred'
      })
      return
    }
    
    // Update local state
    tariffs.value = tariffs.value.filter(t => t.id !== tariffId)
    tariffPrices.value = tariffPrices.value.filter(p => p.tariff_id !== tariffId)
    
    toast.success('Tariff deleted successfully', {
      description: `"${tariffName}" and all its prices have been removed`
    })
  } catch (err) {
    console.error('Error deleting tariff:', err)
    toast.error('Failed to delete tariff', {
      description: err instanceof Error ? err.message : 'An unexpected error occurred'
    })
  }
}

// Delete tariff price
const deleteTariffPrice = async (priceId: string) => {
  const price = tariffPrices.value.find(p => p.id === priceId)
  const priceName = price?.name || 'Unknown Price'
  
  if (!confirm(`Are you sure you want to delete "${priceName}"?`)) return
  
  try {
    const { error: deleteError } = await (supabase as any)
      .from('tariff_prices')
      .delete()
      .eq('id', priceId)
    
    if (deleteError) {
      console.error('Error deleting tariff price:', deleteError)
      toast.error('Failed to delete price', {
        description: deleteError.message || 'An unexpected error occurred'
      })
      return
    }
    
    // Update local state
    tariffPrices.value = tariffPrices.value.filter(p => p.id !== priceId)
    
    toast.success('Price deleted successfully', {
      description: `"${priceName}" has been removed`
    })
  } catch (err) {
    console.error('Error deleting tariff price:', err)
    toast.error('Failed to delete price', {
      description: err instanceof Error ? err.message : 'An unexpected error occurred'
    })
  }
}

// Load data on mount
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header with Actions -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Tariffs Management</h1>

      </div>
      <div class="flex gap-3">
        <Button 
          @click="showAddTariffModal = true"
          class="flex items-center gap-2"
        >
          <Package class="w-4 h-4" />
          Add Tariff
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingState v-if="isLoading" />

    <!-- Error State -->
    <ErrorState 
      v-else-if="error" 
      title="Error Loading Tariffs"
      :message="error"
      @retry="loadData"
    />

    <!-- Content -->
    <div v-else>
      <!-- Tariffs Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Tariff Categories</h2>
            <span class="text-sm text-gray-500">{{ tariffs.length }} {{ tariffs.length === 1 ? 'tariff' : 'tariffs' }}</span>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="tariffs.length === 0" class="text-center py-16">
          <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package class="w-12 h-12 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No tariffs yet</h3>
          <p class="text-gray-500 mb-6 max-w-sm mx-auto">Get started by creating your first tariff category. You can then add pricing options to each tariff.</p>
          <Button @click="showAddTariffModal = true" class="inline-flex items-center gap-2">
            <Package class="w-4 h-4" />
            Create Your First Tariff
          </Button>
        </div>
        
        <!-- Tariffs List -->
        <div v-else class="divide-y divide-gray-200">
          <div v-for="tariff in tariffs" :key="tariff.id" class="">
            <!-- Tariff Header -->
            <div class="px-6 py-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">{{ tariff.name }}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="deleteTariff(tariff.id)"
                  class="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <!-- Prices (Always Expanded) -->
            <div class="px-6 pb-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="font-medium text-gray-900">Pricing Options</h4>
                  <Button 
                    size="sm" 
                    variant="outline"
                    @click="openAddPriceModal(tariff.id)"
                    class="text-xs"
                  >
                    <Plus class="w-3 h-3 mr-1" />
                    Add Price
                  </Button>
                </div>
                
                <div v-if="getPricesForTariff(tariff.id).length === 0" class="text-center py-8">
                  <div class="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <DollarSign class="w-8 h-8 text-gray-400" />
                  </div>
                  <p class="text-gray-500 text-sm">No pricing options defined for this tariff</p>
                </div>
                
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div 
                    v-for="price in getPricesForTariff(tariff.id)" 
                    :key="price.id"
                    class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h5 class="font-medium text-gray-900">{{ price.name }}</h5>
                        <div class="mt-1">
                          <span class="text-lg font-semibold text-green-600">{{ formatPrice(price.price) }}</span>
                        </div>
                        <p class="text-xs text-gray-400 mt-2">Added {{ new Date(price.created_at).toLocaleDateString() }}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="deleteTariffPrice(price.id)"
                        class="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 class="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddTariffModal 
      v-model:open="showAddTariffModal"
      @add-tariff="addTariff"
    />
    
    <AddTariffPriceModal 
      v-model:open="showAddPriceModal"
      :tariffs="tariffs"
      :preselected-tariff-id="preselectedTariffId"
      @add-price="addTariffPrice"
    />
  </div>
</template>
