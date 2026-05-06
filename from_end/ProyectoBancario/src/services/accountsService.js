import axiosClient from './axiosClient'

export const createAccount = (data) =>
  axiosClient.post('/accounts', data).then((r) => r.data)

export const getMyAccounts = () =>
  axiosClient.get('/accounts').then((r) => r.data)

export const getBalance = (accountId) =>
  axiosClient.get(`/accounts/${accountId}/balance`).then((r) => r.data)
