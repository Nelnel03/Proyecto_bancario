import axiosClient from './axiosClient'

export const deposit = (data) =>
  axiosClient.post('/transactions/deposit', data).then((r) => r.data)

export const withdrawal = (data) =>
  axiosClient.post('/transactions/withdrawal', data).then((r) => r.data)

export const transfer = (data) =>
  axiosClient.post('/transactions/transfer', data).then((r) => r.data)

export const getHistory = (accountId) =>
  axiosClient.get(`/transactions/account/${accountId}`).then((r) => r.data)
