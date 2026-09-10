import {
  DepartmentService,
  type SearchDepartmentsParams,
  type SearchDepartmentsResponse,
} from '@client/src/components/business-ui/types/services';

const departmentService = new DepartmentService();

/**
 * 搜索部门
 */
export async function searchDepartments(
  params: SearchDepartmentsParams,
): Promise<SearchDepartmentsResponse> {
  return departmentService.searchDepartments(params);
}

export type { SearchDepartmentsParams, SearchDepartmentsResponse };
