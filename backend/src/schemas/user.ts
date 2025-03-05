export interface OrganizationRole {
  id: string;
  role: string;
  organization_id: string;
}

export interface UserBase {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  organization?: OrganizationRole;

  organization_id?: string; // 计算属性在 TypeScript 中不需要
}
