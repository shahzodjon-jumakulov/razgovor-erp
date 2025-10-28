export interface Student {
  id: string
  manager_id: string
  student_code: string
  full_name: string
  phone: string
  tariff_id: string
  tariff_price_id: string
  group_code: string
  notes?: string
  created_at: string
}

export interface StudentPayment {
  id: string
  student_id: string
  payment_date: string
  payment_type: string
  amount: number
  receipt_url: string
  created_at: string
}

export interface StudentWithTariff extends Student {
  tariff?: {
    id: string
    name: string
  }
  tariff_price?: {
    id: string
    name: string
    price: number
  }
}
