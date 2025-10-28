<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface Tariff {
  id: string
  name: string
  created_at: string
}

interface Props {
  open: boolean
  tariffs: Tariff[]
  preselectedTariffId?: string
}

interface Emits {
  'update:open': [value: boolean]
  'add-price': [tariffId: string, name: string, price: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedTariffId = ref('')
const priceName = ref('')
const price = ref<number | undefined>(undefined)
const priceDisplay = ref('')
const isSubmitting = ref(false)

// Format price for display
const formatPriceDisplay = (value: number) => {
  return new Intl.NumberFormat('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Handle price input changes
const handlePriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.replace(/[^0-9]/g, '') // Remove all non-numeric characters
  
  if (rawValue === '') {
    price.value = undefined
    priceDisplay.value = ''
    return
  }
  
  const numericValue = parseInt(rawValue)
  price.value = numericValue
  priceDisplay.value = formatPriceDisplay(numericValue)
}

// Handle focus - show raw number for editing
const handlePriceFocus = () => {
  if (price.value) {
    priceDisplay.value = price.value.toString()
  }
}

// Handle blur - show formatted number
const handlePriceBlur = () => {
  if (price.value) {
    priceDisplay.value = formatPriceDisplay(price.value)
  }
}

const handleSubmit = async () => {
  if (!selectedTariffId.value || !priceName.value.trim() || !price.value || price.value <= 0) return
  
  isSubmitting.value = true
  emit('add-price', selectedTariffId.value, priceName.value.trim(), price.value)
  
  // Reset form
  selectedTariffId.value = ''
  priceName.value = ''
  price.value = undefined
  priceDisplay.value = ''
  isSubmitting.value = false
  emit('update:open', false)
}

const handleCancel = () => {
  selectedTariffId.value = ''
  priceName.value = ''
  price.value = undefined
  priceDisplay.value = ''
  emit('update:open', false)
}

// Handle modal opening and preselection
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Set preselected tariff if provided
    if (props.preselectedTariffId) {
      selectedTariffId.value = props.preselectedTariffId
    }
    
    nextTick(() => {
      // Focus the appropriate input based on whether tariff is preselected
      if (props.preselectedTariffId) {
        const nameInput = document.querySelector('#price-name-input') as HTMLInputElement
        nameInput?.focus()
      } else {
        const select = document.querySelector('#tariff-select') as HTMLSelectElement
        select?.focus()
      }
    })
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Tariff Price</DialogTitle>
        <DialogDescription>
          Add a pricing option to an existing tariff. Enter the price amount in UZS.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="tariff-select" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Select Tariff
          </label>
          <select 
            id="tariff-select"
            v-model="selectedTariffId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            required
          >
            <option value="">Choose a tariff...</option>
            <option v-for="tariff in tariffs" :key="tariff.id" :value="tariff.id">
              {{ tariff.name }}
            </option>
          </select>
        </div>
        
        <div class="space-y-2">
          <label for="price-name-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Price Name
          </label>
          <Input
            id="price-name-input"
            v-model="priceName"
            placeholder="e.g., Standard, Premium, Student"
            :disabled="isSubmitting"
            required
          />
        </div>
        
        <div class="space-y-2">
          <label for="price-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Price (UZS)
          </label>
          <Input
            id="price-input"
            v-model="priceDisplay"
            type="text"
            placeholder="10,000,000"
            :disabled="isSubmitting"
            required
            @input="handlePriceInput"
            @focus="handlePriceFocus"
            @blur="handlePriceBlur"
          />
          <p class="text-xs text-muted-foreground">Enter price in Uzbek Som (e.g., 10,000,000)</p>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!selectedTariffId || !priceName.trim() || !price || (price && price <= 0) || isSubmitting"
          >
            {{ isSubmitting ? 'Adding...' : 'Add Price' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
