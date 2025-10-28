<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, X, FileText, Calendar, DollarSign, CalendarIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Calendar as CalendarComponent } from '~/components/ui/calendar'
import { toast } from 'vue-sonner'
import { CalendarDate, today, getLocalTimeZone, type DateValue, parseDate } from '@internationalized/date'

interface Props {
  open: boolean
  studentId: string
  studentName: string
}

interface Emits {
  'update:open': [value: boolean]
  'payment-added': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const supabase = useSupabaseClient()

// Form state
const form = ref({
  payment_date: today(getLocalTimeZone()) as DateValue,
  payment_type: '',
  amount: ''
})

// Calendar state
const isCalendarOpen = ref(false)

// File upload state
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const isDragOver = ref(false)
const isUploading = ref(false)
const isSubmitting = ref(false)


// Validation
const isFormValid = computed(() => {
  return form.value.payment_date &&
         form.value.payment_type.trim() &&
         form.value.amount &&
         parseFloat(form.value.amount) > 0 &&
         selectedFile.value
})

// Format amount input
const formatAmount = (value: string) => {
  const numericValue = value.replace(/[^0-9]/g, '')
  if (!numericValue) return ''
  
  return new Intl.NumberFormat('uz-UZ').format(parseInt(numericValue))
}

const handleAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.replace(/[^0-9]/g, '')
  form.value.amount = rawValue
  target.value = formatAmount(rawValue)
}

// File handling
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file: File) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    toast.error('Invalid file type', {
      description: 'Please upload an image (JPEG, PNG, WebP) or PDF file'
    })
    return
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large', {
      description: 'Please upload a file smaller than 5MB'
    })
    return
  }
  
  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// Upload file to Supabase Storage
const uploadFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop() || 'bin'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `payment-receipts/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file)
  
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath)
  
  return publicUrl
}

// Submit payment
const submitPayment = async () => {
  if (!isFormValid.value || !selectedFile.value) return
  
  try {
    isSubmitting.value = true
    
    // Upload receipt file
    const receiptUrl = await uploadFile(selectedFile.value)
    
    // Insert payment record
    const { error: insertError } = await (supabase as any)
      .from('student_payments')
      .insert({
        student_id: props.studentId,
        payment_date: form.value.payment_date?.toString() || new Date().toISOString().split('T')[0],
        payment_type: form.value.payment_type.trim(),
        amount: parseFloat(form.value.amount),
        receipt_url: receiptUrl,
        created_at: new Date().toISOString()
      })
    
    if (insertError) {
      throw insertError
    }
    
    // Show success toast
    toast.success('Payment recorded successfully', {
      description: `Payment of ${formatAmount(form.value.amount)} UZS for ${props.studentName}`
    })
    
    // Reset form and close dialog
    resetForm()
    emit('update:open', false)
    emit('payment-added')
    
  } catch (error) {
    console.error('Error adding payment:', error)
    toast.error('Failed to record payment', {
      description: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    payment_date: today(getLocalTimeZone()) as DateValue,
    payment_type: '',
    amount: ''
  }
  selectedFile.value = null
  isCalendarOpen.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Handle dialog close
const handleClose = () => {
  if (!isSubmitting.value) {
    resetForm()
    emit('update:open', false)
  }
}

// Set default date to today when dialog opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value.payment_date = today(getLocalTimeZone()) as DateValue
  }
})

// Handle date selection
const handleDateSelect = (date: DateValue | undefined) => {
  if (date) {
    form.value.payment_date = date
    isCalendarOpen.value = false
  }
}

// Format date for display
const formatDateDisplay = (date: DateValue) => {
  if (!date) return 'Pick a date'
  try {
    const jsDate = (date as any).toDate ? (date as any).toDate(getLocalTimeZone()) : new Date(date.toString())
    return jsDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return date.toString()
  }
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <DollarSign class="h-5 w-5 text-green-600" />
          Add Payment
        </DialogTitle>
        <p class="text-sm text-muted-foreground">
          Record a new payment for {{ studentName }}
        </p>
      </DialogHeader>
      
      <form @submit.prevent="submitPayment" class="space-y-4">
        <!-- Payment Date -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">
            Payment Date *
          </label>
          <Popover v-model:open="isCalendarOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
                :class="!form.payment_date && 'text-muted-foreground'"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ form.payment_date ? formatDateDisplay(form.payment_date as any) : 'Pick a date' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <CalendarComponent
                :model-value="form.payment_date as any"
                @update:model-value="handleDateSelect"
                :initial-focus="true"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Payment Type -->
        <div class="space-y-2">
          <label for="payment-type" class="text-sm font-medium leading-none">
            Payment Type *
          </label>
          <Input
            id="payment-type"
            v-model="form.payment_type"
            type="text"
            placeholder="e.g., Cash, Card, Bank Transfer, Online"
            required
          />
        </div>

        <!-- Amount -->
        <div class="space-y-2">
          <label for="amount" class="text-sm font-medium leading-none">
            Amount (UZS) *
          </label>
          <div class="relative">
            <DollarSign class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="text"
              placeholder="10,000,000"
              required
              class="pl-10"
              @input="handleAmountInput"
            />
          </div>
        </div>

        <!-- Receipt Upload -->
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none">
            Receipt Upload *
          </label>
          
          <!-- File Drop Zone -->
          <div
            v-if="!selectedFile"
            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
            :class="isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleFileDrop"
            @click="triggerFileSelect"
          >
            <Upload class="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p class="text-sm text-gray-600 mb-1">
              <span class="font-medium text-blue-600 cursor-pointer">Click to upload</span>
              or drag and drop
            </p>
            <p class="text-xs text-gray-500">
              PNG, JPG, WebP or PDF (max. 5MB)
            </p>
          </div>

          <!-- Selected File Display -->
          <div v-else class="border rounded-lg p-4 bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <FileText class="h-8 w-8 text-blue-600" />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="removeFile"
                class="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*,.pdf"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>


        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="bg-green-600 hover:bg-green-700"
          >
            <DollarSign class="mr-2 h-4 w-4" />
            {{ isSubmitting ? 'Recording...' : 'Record Payment' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
