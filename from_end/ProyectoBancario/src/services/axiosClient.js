import axios from 'axios'
import toast from 'react-hot-toast'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error('El servidor tardó demasiado. Intenta de nuevo.')
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.error('Tu sesión expiró. Inicia sesión de nuevo.')
      setTimeout(() => { window.location.href = '/login' }, 1500)
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default axiosClient
