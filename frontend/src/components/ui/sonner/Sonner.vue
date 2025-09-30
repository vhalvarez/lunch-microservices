<script lang="ts" setup>
import { Toaster as Sonner } from "vue-sonner"
</script>

<template>
  <Sonner
    position="top-right"
    :rich-colors="true"
    :close-button="true"
    :duration="4000"
    :visible-toasts="5"
    theme="light"
    class="toaster-container"
  />
</template>

<style scoped>
.toaster-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 99999;
}

:global([data-sonner-toaster]) {
  position: fixed !important;
  top: 1rem !important;
  right: 1rem !important;
  z-index: 99999 !important;
  pointer-events: none;
}

:global([data-sonner-toast]) {
  pointer-events: auto;
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
  color: #1a202c !important;
  font-family: ui-sans-serif, system-ui, sans-serif !important;
  min-width: 300px !important;
  max-width: 400px !important;
}

:global([data-sonner-toast][data-type="success"]) {
  background: #f0fff4 !important;
  border-color: #68d391 !important;
  color: #22543d !important;
}

:global([data-sonner-toast][data-type="error"]) {
  background: #fed7d7 !important;
  border-color: #fc8181 !important;
  color: #742a2a !important;
}

:global([data-sonner-toast][data-type="warning"]) {
  background: #fefcbf !important;
  border-color: #f6e05e !important;
  color: #744210 !important;
}

:global([data-sonner-toast] [data-title]) {
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
}

:global([data-sonner-toast] [data-description]) {
  font-size: 0.75rem !important;
  line-height: 1rem !important;
  opacity: 0.8 !important;
  margin-top: 0.25rem !important;
}
</style>
