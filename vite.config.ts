import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Added comment to force git state sync for deployment
export default defineConfig({
  plugins: [react()],
})
