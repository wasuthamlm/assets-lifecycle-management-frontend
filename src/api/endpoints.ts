export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  dashboard: {
    summary: '/dashboard/summary',
  },
  assets: {
    base: '/assets',
    byId: (id: number) => `/assets/${id}`,
  },
  requisitions: {
    base: '/requisitions',
    byId: (id: number) => `/requisitions/${id}`,
    approve: (id: number) => `/requisitions/${id}/approve`,
  },
  employees: {
    base: '/employees',
    byId: (id: number) => `/employees/${id}`,
  },
  departments: {
    base: '/departments',
  },
  assetCategories: {
    base: '/asset-categories',
  },
  purchaseOrders: {
    base: '/purchase-orders',
    byId: (id: number) => `/purchase-orders/${id}`,
    status: (id: number) => `/purchase-orders/${id}/status`,
  },
  vendors: {
    base: '/vendors',
  },
  goodsReceipts: {
    base: '/goods-receipts',
    byId: (id: number) => `/goods-receipts/${id}`,
  },
  assignments: {
    base: '/assignments',
    issue: '/assignments/issue',
    return: (id: number) => `/assignments/${id}/return`,
    byAsset: (assetId: number) => `/assignments/asset/${assetId}`,
    byId: (id: number) => `/assignments/${id}`,
  },
  movements: {
    base: '/movements',
    byAsset: (assetId: number) => `/movements/asset/${assetId}`,
  },
  repairs: {
    base: '/repairs',
    byId: (id: number) => `/repairs/${id}`,
    status: (id: number) => `/repairs/${id}/status`,
  },
  warranty: {
    base: '/warranties',
    byId: (id: number) => `/warranties/${id}`,
    byAsset: (assetId: number) => `/warranties/asset/${assetId}`,
    renew: (id: number) => `/warranties/${id}/renew`,
  },
  disposal: {
    base: '/disposals',
    byId: (id: number) => `/disposals/${id}`,
  },
  stock: {
    items: '/stock/items',
    itemById: (id: number) => `/stock/items/${id}`,
    levelsByLocation: (locationId: number) => `/stock/levels/location/${locationId}`,
    adjust: '/stock/levels/adjust',
  },
  locations: {
    base: '/locations',
  },
  companies: {
    base: '/companies',
  },
  users: {
    base: '/users',
    byId: (id: number) => `/users/${id}`,
  },
  rolesPermissions: {
    roles: '/roles',
    permissions: '/permissions',
  },
} as const
