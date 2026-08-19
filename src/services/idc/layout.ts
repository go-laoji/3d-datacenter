import { request } from '@umijs/max';

export async function getDatacenterLayout(datacenterId: string) {
  return request<IDC.ApiResponse<IDC.DatacenterLayout>>(
    `/api/idc/datacenters/${datacenterId}/layout`,
    {
      method: 'GET',
    },
  );
}

export async function saveDatacenterLayout(
  datacenterId: string,
  data: Omit<IDC.DatacenterLayout, 'datacenterId' | 'updatedAt' | 'version'> & {
    version?: number;
    force?: boolean;
  },
) {
  return request<IDC.ApiResponse<IDC.DatacenterLayout>>(
    `/api/idc/datacenters/${datacenterId}/layout`,
    {
      method: 'PUT',
      data,
    },
  );
}
