import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { RequisitionsListPage } from '@/pages/requisitions/RequisitionsListPage'
import { RequisitionCreatePage } from '@/pages/requisitions/RequisitionCreatePage'
import { RequisitionDetailPage } from '@/pages/requisitions/RequisitionDetailPage'
import { AssetsListPage } from '@/pages/assets/AssetsListPage'
import { AssetCreatePage } from '@/pages/assets/AssetCreatePage'
import { AssetDetailPage } from '@/pages/assets/AssetDetailPage'
import { PurchaseOrdersListPage } from '@/pages/purchasing/PurchaseOrdersListPage'
import { PurchaseOrderCreatePage } from '@/pages/purchasing/PurchaseOrderCreatePage'
import { PurchaseOrderDetailPage } from '@/pages/purchasing/PurchaseOrderDetailPage'
import { GoodsReceiptsListPage } from '@/pages/goods-receipts/GoodsReceiptsListPage'
import { GoodsReceiptCreatePage } from '@/pages/goods-receipts/GoodsReceiptCreatePage'
import { GoodsReceiptDetailPage } from '@/pages/goods-receipts/GoodsReceiptDetailPage'
import { AssignmentsListPage } from '@/pages/assignments/AssignmentsListPage'
import { AssignmentDetailPage } from '@/pages/assignments/AssignmentDetailPage'
import { RepairsListPage } from '@/pages/repairs/RepairsListPage'
import { RepairCreatePage } from '@/pages/repairs/RepairCreatePage'
import { RepairDetailPage } from '@/pages/repairs/RepairDetailPage'
import { WarrantySearchPage } from '@/pages/warranty/WarrantySearchPage'
import { WarrantyDetailPage } from '@/pages/warranty/WarrantyDetailPage'
import { DisposalsListPage } from '@/pages/disposal/DisposalsListPage'
import { DisposalCreatePage } from '@/pages/disposal/DisposalCreatePage'
import { DisposalDetailPage } from '@/pages/disposal/DisposalDetailPage'
import { StockListPage } from '@/pages/stock/StockListPage'
import { StockCreatePage } from '@/pages/stock/StockCreatePage'
import { MovementsListPage } from '@/pages/movements/MovementsListPage'
import { EmployeesListPage } from '@/pages/employees/EmployeesListPage'
import { UsersListPage } from '@/pages/users/UsersListPage'
import { RolesPermissionsPage } from '@/pages/roles-permissions/RolesPermissionsPage'
import { MyItemsPage } from '@/pages/my-items/MyItemsPage'
import { ApprovalsPage } from '@/pages/approvals/ApprovalsPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          {
            element: <PermissionRoute permission="dashboard.view" />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/reports', element: <ReportsPage /> },
            ],
          },

          {
            element: <PermissionRoute permission="requisition.view_all" />,
            children: [{ path: '/requisitions', element: <RequisitionsListPage /> }],
          },
          {
            element: <PermissionRoute permission="requisition.create" />,
            children: [{ path: '/requisitions/new', element: <RequisitionCreatePage /> }],
          },
          {
            element: <PermissionRoute permission="requisition.view_own" />,
            children: [{ path: '/requisitions/:id', element: <RequisitionDetailPage /> }],
          },

          {
            element: <PermissionRoute permission="asset.view" />,
            children: [
              { path: '/assets', element: <AssetsListPage /> },
              { path: '/assets/:id', element: <AssetDetailPage /> },
              { path: '/movements', element: <MovementsListPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="asset.create" />,
            children: [{ path: '/assets/new', element: <AssetCreatePage /> }],
          },

          {
            element: <PermissionRoute permission="assignment.return" />,
            children: [
              { path: '/assignments', element: <AssignmentsListPage /> },
              { path: '/assignments/:id', element: <AssignmentDetailPage /> },
            ],
          },

          {
            element: <PermissionRoute permission="po.view" />,
            children: [
              { path: '/purchasing', element: <PurchaseOrdersListPage /> },
              { path: '/purchasing/:id', element: <PurchaseOrderDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="po.create" />,
            children: [{ path: '/purchasing/new', element: <PurchaseOrderCreatePage /> }],
          },

          {
            element: <PermissionRoute permission="goods_receipt.view" />,
            children: [
              { path: '/goods-receipts', element: <GoodsReceiptsListPage /> },
              { path: '/goods-receipts/:id', element: <GoodsReceiptDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="goods_receipt.create" />,
            children: [{ path: '/goods-receipts/new', element: <GoodsReceiptCreatePage /> }],
          },

          {
            element: <PermissionRoute permission="stock.view" />,
            children: [{ path: '/stock', element: <StockListPage /> }],
          },
          {
            element: <PermissionRoute permission="stock.manage" />,
            children: [{ path: '/stock/new', element: <StockCreatePage /> }],
          },

          {
            element: <PermissionRoute permission="repair.view" />,
            children: [
              { path: '/repairs', element: <RepairsListPage /> },
              { path: '/repairs/:id', element: <RepairDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="repair.create" />,
            children: [{ path: '/repairs/new', element: <RepairCreatePage /> }],
          },

          { path: '/warranty', element: <WarrantySearchPage /> },
          { path: '/warranty/:id', element: <WarrantyDetailPage /> },

          {
            element: <PermissionRoute permission="disposal.view" />,
            children: [
              { path: '/disposal', element: <DisposalsListPage /> },
              { path: '/disposal/:id', element: <DisposalDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="disposal.create" />,
            children: [{ path: '/disposal/new', element: <DisposalCreatePage /> }],
          },

          { path: '/my-items', element: <MyItemsPage /> },
          {
            element: <PermissionRoute permission="requisition.approve" />,
            children: [{ path: '/approvals', element: <ApprovalsPage /> }],
          },
          {
            element: <PermissionRoute permission="employee.view_all" />,
            children: [{ path: '/employees', element: <EmployeesListPage /> }],
          },
          {
            element: <PermissionRoute permission="rbac.manage" />,
            children: [{ path: '/roles-permissions', element: <RolesPermissionsPage /> }],
          },
          {
            element: <PermissionRoute permission="user.view_all" />,
            children: [{ path: '/users', element: <UsersListPage /> }],
          },
          { path: '/settings', element: <SettingsPage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
