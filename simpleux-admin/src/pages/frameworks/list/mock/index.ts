/**
 * 计件项目 Mock 数据
 */
import { FrameworkAgreement } from '@/types/framework';

// 模拟计件项目数据
const mockFrameworks: FrameworkAgreement[] = [
  {
    id: 'fram1',
    code: 'FRAM-20241201-0001',
    name: 'XX电商平台主项目',
    managerId: 'user1',
    managerName: '张三',
    bizManager: '李四',
    group: '设计一部',
    clientDept: '电商客户部',
    createdAt: '2024-12-01 10:00:00',
    updatedAt: '2024-12-01 10:00:00',
    createdBy: 'user1',
  },
  {
    id: 'fram2',
    code: 'FRAM-20241202-0001',
    name: 'XX金融系统主项目',
    managerId: 'user2',
    managerName: '王五',
    bizManager: '赵六',
    group: '设计二部',
    clientDept: '金融客户部',
    createdAt: '2024-12-02 14:00:00',
    updatedAt: '2024-12-02 14:00:00',
    createdBy: 'user2',
  },
  {
    id: 'fram3',
    code: 'FRAM-20241203-0001',
    name: 'XX企业服务平台主项目',
    managerId: 'user1',
    managerName: '张三',
    group: '设计一部',
    clientDept: '企业客户部',
    createdAt: '2024-12-03 09:00:00',
    updatedAt: '2024-12-03 09:00:00',
    createdBy: 'user1',
  },
];

export interface GetFrameworksParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  manager?: string[];
  group?: string[];
  clientDept?: string[];
}

export interface GetFrameworksResult {
  data: FrameworkAgreement[];
  total: number;
}

/**
 * 获取计件项目列表
 */
export function getFrameworks(
  params: GetFrameworksParams = {}
): Promise<GetFrameworksResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...mockFrameworks];

      // 关键词搜索（名称）
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        filtered = filtered.filter((item) =>
          item.name.toLowerCase().includes(keyword)
        );
      }

      // 项目经理筛选
      if (params.manager && params.manager.length > 0) {
        filtered = filtered.filter((item) =>
          params.manager!.includes(item.managerName)
        );
      }

      // 部门筛选
      if (params.group && params.group.length > 0) {
        filtered = filtered.filter((item) =>
          params.group!.includes(item.group)
        );
      }

      // 客户部筛选
      if (params.clientDept && params.clientDept.length > 0) {
        filtered = filtered.filter(
          (item) =>
            item.clientDept && params.clientDept!.includes(item.clientDept)
        );
      }

      const total = filtered.length;
      const { current = 1, pageSize = 10 } = params;
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      const data = filtered.slice(start, end);

      resolve({
        data,
        total,
      });
    }, 300);
  });
}

/**
 * 根据ID获取计件项目
 */
export function getFrameworkById(
  id: string
): Promise<FrameworkAgreement | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const framework = mockFrameworks.find((item) => item.id === id);
      resolve(framework || null);
    }, 200);
  });
}

/**
 * 创建计件项目
 */
export function createFramework(
  data: Omit<
    FrameworkAgreement,
    'id' | 'code' | 'createdAt' | 'updatedAt' | 'createdBy'
  >
): Promise<FrameworkAgreement> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 生成自动编号
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const sequence = String(mockFrameworks.length + 1).padStart(4, '0');
      const code = `FRAM-${dateStr}-${sequence}`;

      const newFramework: FrameworkAgreement = {
        id: `fram${Date.now()}`,
        code,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user-id', // TODO: 从用户信息获取
      };

      mockFrameworks.push(newFramework);
      resolve(newFramework);
    }, 500);
  });
}

/**
 * 更新计件项目
 */
export function updateFramework(
  id: string,
  data: Partial<
    Omit<FrameworkAgreement, 'id' | 'code' | 'createdAt' | 'createdBy'>
  >
): Promise<FrameworkAgreement> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockFrameworks.findIndex((item) => item.id === id);
      if (index === -1) {
        reject(new Error('计件项目不存在'));
        return;
      }

      const updatedFramework: FrameworkAgreement = {
        ...mockFrameworks[index],
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user-id', // TODO: 从用户信息获取
      };

      mockFrameworks[index] = updatedFramework;
      resolve(updatedFramework);
    }, 500);
  });
}

/**
 * 删除计件项目
 */
export function deleteFramework(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockFrameworks.findIndex((item) => item.id === id);
      if (index === -1) {
        reject(new Error('计件项目不存在'));
        return;
      }

      mockFrameworks.splice(index, 1);
      resolve();
    }, 500);
  });
}
