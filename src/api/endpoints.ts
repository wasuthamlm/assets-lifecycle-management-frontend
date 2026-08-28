export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    ssoExchange: '/auth/sso/exchange',
    completeEmployeeProfile: '/auth/me/employee-profile',
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
    nextNo: '/requisitions/next-no',
    mine: '/requisitions/mine',
    attachments: (id: number) => `/requisitions/${id}/attachments`,
    attachmentById: (id: number, attachmentId: number) => `/requisitions/${id}/attachments/${attachmentId}`,
  },
  employees: {
    base: '/employees',
    byId: (id: number) => `/employees/${id}`,
    directory: '/employees/directory',
    roles: (id: number) => `/employees/${id}/roles`,
    preRegister: '/employees/pre-register',
  },
  departments: {
    base: '/departments',
  },
  assetCategories: {
    base: '/asset-categories',
    byId: (id: number) => `/asset-categories/${id}`,
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
    byId: (id: number) => `/locations/${id}`,
  },
  companies: {
    base: '/companies',
  },
  allowedDomains: {
    base: '/allowed-domains',
    byId: (id: number) => `/allowed-domains/${id}`,
  },
  users: {
    base: '/users',
    byId: (id: number) => `/users/${id}`,
  },
  rolesPermissions: {
    roles: '/roles',
    permissions: '/permissions',
    rolePermissions: (id: number) => `/roles/${id}/permissions`,
  },
  attachments: {
    base: '/attachments',
    upload: '/attachments/upload',
    byId: (id: number) => `/attachments/${id}`,
  },
  notifications: {
    base: '/notifications',
    stream: '/notifications/stream',
    unreadCount: '/notifications/unread-count',
    markRead: (id: number) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    dismiss: (id: number) => `/notifications/${id}/dismiss`,
    dismissAll: '/notifications/dismiss-all',
  },
} as const
