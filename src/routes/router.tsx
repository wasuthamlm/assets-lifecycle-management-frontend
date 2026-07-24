import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
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
import { MasterDataPage } from '@/pages/master-data/MasterDataPage'
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
          { path: '/dashboard', element: <DashboardPage /> },

          { path: '/requisitions', element: <RequisitionsListPage /> },
          { path: '/requisitions/new', element: <RequisitionCreatePage /> },
          { path: '/requisitions/:id', element: <RequisitionDetailPage /> },

          { path: '/assets', element: <AssetsListPage /> },
          { path: '/assets/new', element: <AssetCreatePage /> },
          { path: '/assets/:id', element: <AssetDetailPage /> },

          { path: '/assignments', element: <AssignmentsListPage /> },
          { path: '/assignments/:id', element: <AssignmentDetailPage /> },

          { path: '/purchasing', element: <PurchaseOrdersListPage /> },
          { path: '/purchasing/new', element: <PurchaseOrderCreatePage /> },
          { path: '/purchasing/:id', element: <PurchaseOrderDetailPage /> },

          { path: '/goods-receipts', element: <GoodsReceiptsListPage /> },
          { path: '/goods-receipts/new', element: <GoodsReceiptCreatePage /> },
          { path: '/goods-receipts/:id', element: <GoodsReceiptDetailPage /> },

          { path: '/stock', element: <StockListPage /> },
          { path: '/stock/new', element: <StockCreatePage /> },

          { path: '/repairs', element: <RepairsListPage /> },
          { path: '/repairs/new', element: <RepairCreatePage /> },
          { path: '/repairs/:id', element: <RepairDetailPage /> },

          { path: '/warranty', element: <WarrantySearchPage /> },
          { path: '/warranty/:id', element: <WarrantyDetailPage /> },

          { path: '/disposal', element: <DisposalsListPage /> },
          { path: '/disposal/new', element: <DisposalCreatePage /> },
          { path: '/disposal/:id', element: <DisposalDetailPage /> },

          { path: '/movements', element: <MovementsListPage /> },
          { path: '/my-items', element: <MyItemsPage /> },
          { path: '/approvals', element: <ApprovalsPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/employees', element: <EmployeesListPage /> },
          { path: '/master-data', element: <MasterDataPage /> },
          { path: '/roles-permissions', element: <RolesPermissionsPage /> },
          { path: '/users', element: <UsersListPage /> },
          { path: '/settings', element: <SettingsPage /> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
