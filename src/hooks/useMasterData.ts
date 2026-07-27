import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { masterDataService } from '@/api/services/master-data.service'
import type {
  CreateAllowedDomainDto,
  CreateAssetCategoryDto,
  UpdateAllowedDomainDto,
  UpdateAssetCategoryDto,
} from '@/api/types/master-data.types'

export function useAssetCategoriesQuery() {
  return useQuery({ queryKey: ['asset-categories'], queryFn: masterDataService.assetCategories, staleTime: 5 * 60 * 1000 })
}

export function useCreateAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAssetCategoryDto) => masterDataService.createAssetCategory(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  })
}

export function useUpdateAssetCategoryMutation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateAssetCategoryDto) => masterDataService.updateAssetCategory(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  })
}

export function useDeleteAssetCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => masterDataService.deleteAssetCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asset-categories'] }),
  })
}

export function useVendorsQuery() {
  return useQuery({ queryKey: ['vendors'], queryFn: masterDataService.vendors, staleTime: 5 * 60 * 1000 })
}

export function useLocationsQuery() {
  return useQuery({ queryKey: ['locations'], queryFn: masterDataService.locations, staleTime: 5 * 60 * 1000 })
}

export function useCompaniesQuery() {
  return useQuery({ queryKey: ['companies'], queryFn: masterDataService.companies, staleTime: 5 * 60 * 1000 })
}

export function useDepartmentsQuery() {
  return useQuery({ queryKey: ['departments'], queryFn: masterDataService.departments, staleTime: 5 * 60 * 1000 })
}

export function useAllowedDomainsQuery() {
  return useQuery({ queryKey: ['allowed-domains'], queryFn: masterDataService.allowedDomains, staleTime: 5 * 60 * 1000 })
}

export function useCreateAllowedDomainMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAllowedDomainDto) => masterDataService.createAllowedDomain(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allowed-domains'] }),
  })
}

// id ไม่ผูกไว้ตอนสร้าง hook (ต่างจาก useUpdateAssetCategoryMutation) เพราะต้องใช้ toggle
// เปิด/ปิดได้ทีละแถวในตารางเดียวกัน — ส่ง id มาพร้อม dto ตอน mutate() แทน
export function useUpdateAllowedDomainMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAllowedDomainDto }) => masterDataService.updateAllowedDomain(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allowed-domains'] }),
  })
}

export function useDeleteAllowedDomainMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => masterDataService.deleteAllowedDomain(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allowed-domains'] }),
  })
}
