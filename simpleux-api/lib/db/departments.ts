/**
 * 部门数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface Department {
  id: string;
  dingtalk_dept_id?: string;
  name: string;
  parent_id?: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[];
  user_count?: number;
}

/**
 * 获取所有部门列表
 */
export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('获取部门列表失败:', error);
    throw new Error(`获取部门列表失败: ${error.message}`);
  }

  return (data as Department[]) || [];
}

/**
 * 获取部门树形结构
 */
export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  const departments = await getDepartments();
  
  // 构建部门映射
  const deptMap = new Map<string, DepartmentTreeNode>();
  departments.forEach((dept) => {
    deptMap.set(dept.id, { ...dept, children: [] });
  });

  // 构建树形结构
  const rootNodes: DepartmentTreeNode[] = [];
  departments.forEach((dept) => {
    const node = deptMap.get(dept.id)!;
    if (dept.parent_id && deptMap.has(dept.parent_id)) {
      const parent = deptMap.get(dept.parent_id)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // 获取每个部门的用户数量
  const supabase = await createClient();
  const { data: userCounts } = await supabase
    .from('profiles')
    .select('department')
    .eq('status', '在职');

  const countMap = new Map<string, number>();
  if (userCounts) {
    userCounts.forEach((uc: any) => {
      if (uc.department) {
        const count = countMap.get(uc.department) || 0;
        countMap.set(uc.department, count + 1);
      }
    });
  }

  // 递归添加用户数量
  function addUserCount(node: DepartmentTreeNode): number {
    let count = countMap.get(node.name) || 0;
    if (node.children) {
      node.children.forEach((child) => {
        count += addUserCount(child);
      });
    }
    node.user_count = count;
    return count;
  }

  rootNodes.forEach((node) => {
    addUserCount(node);
  });

  return rootNodes;
}

