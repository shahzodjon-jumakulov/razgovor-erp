export const useToast = () => {
  const show = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${message}`)
  }
  return { show }
}
