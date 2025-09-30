import { toast as sonnerToast } from 'vue-sonner'

export function useToast() {
  const toast = {
    success: (message: string, options?: { description?: string }) => {
      console.log('Toast success called:', message, options)
      sonnerToast.success(message, options)
    },
    
    error: (message: string, options?: { description?: string }) => {
      console.log('Toast error called:', message, options)
      sonnerToast.error(message, options)
    },
    
    warning: (message: string, options?: { description?: string }) => {
      console.log('Toast warning called:', message, options)
      sonnerToast.warning(message, options)
    },
    
    info: (message: string, options?: { description?: string }) => {
      console.log('Toast info called:', message, options)
      sonnerToast.info(message, options)
    }
  }

  return { toast }
}
