import { api } from "@shared/lib/axios";
import type { ApiResponse } from "@shared/types/api";
import type { Role } from "@shared/types/role";

export const roleService = {
  /** GET /roles */
  async list(): Promise<Role[]> {
    const { data } = await api.get<ApiResponse<Role[]>>("/roles");
    return data.data;
  },
};
