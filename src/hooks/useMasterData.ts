import { useQuery } from '@tanstack/react-query'
import { masterDataService } from '@/api/services/master-data.service'

export function useAssetCategoriesQuery() {
  return useQuery({ queryKey: ['asset-categories'], queryFn: masterDataService.assetCategories, staleTime: 5 * 60 * 1000 })
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
