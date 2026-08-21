import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { masterDataService } from '@/api/services/master-data.service'
import type {
  CreateAllowedDomainDto,
  CreateAssetCategoryDto,
  CreateCompanyDto,
  CreateLocationDto,
  CreateVendorDto,
  UpdateAllowedDomainDto,
  UpdateAssetCategoryDto,
  UpdateLocationDto,
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

export function useCreateVendorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorDto) => masterDataService.createVendor(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  })
}

export function useLocationsQuery() {
  return useQuery({ queryKey: ['locations'], queryFn: masterDataService.locations, staleTime: 5 * 60 * 1000 })
}

export function useCreateLocationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLocationDto) => masterDataService.createLocation(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useUpdateLocationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateLocationDto }) => masterDataService.updateLocation(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useDeleteLocationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => masterDataService.deleteLocation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useCompaniesQuery() {
  return useQuery({ queryKey: ['companies'], queryFn: masterDataService.companies, staleTime: 5 * 60 * 1000 })
}

export function useCreateCompanyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCompanyDto) => masterDataService.createCompany(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  })
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
