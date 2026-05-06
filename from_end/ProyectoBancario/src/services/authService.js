import axiosClient from './axiosClient'

export const register = (data) =>
  axiosClient.post('/auth/register', data).then((r) => r.data)

export const login = (data) =>
  axiosClient.post('/auth/login', data).then((r) => r.data)
