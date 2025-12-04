/**
 * 商业项目 Mock 数据（严格按照文档定义）
 */
import { Project } from '@/types';

export const mockProjects: Project[] = [
  {
    id: '1',
    code: 'PROJ-2024-001',
    name: 'XX银行移动端设计项目',
    type: '项目制',
    status: '进行中',
    isPendingEntry: false,
    managerId: 'user1',
    managerName: '张三',
    group: '设计一部',
    bizManager: '李四',
    clientDept: '金融客户部',
    planStartDate: '2024-01-01',
    planEndDate: '2024-06-30',
    progress: 60,
    contractAmount: 500000.0,
    completedAmount: 300000.0, // 完成金额（进度 × 业绩金额）
    acceptedAmount: 0, // 验收金额
    laborBudgetTotal: 300000.0,
    laborExpenseTotal: 180000.0,
    travelBudgetTotal: 50000.0,
    travelExpenseTotal: 30000.0,
    outsourceBudgetTotal: 100000.0,
    outsourceExpenseTotal: 50000.0,
    estimatedProfitRate: 10.0,
    actualProfitRate: 48.0,
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
    // 阶段信息（项目制）
    stages: [
      {
        id: 'stage1',
        name: '需求分析',
        percentage: 20,
        status: 'completed',
        completionPercentage: 100,
        completedAt: '2024-01-15T00:00:00Z',
        completedBy: 'user1',
      },
      {
        id: 'stage2',
        name: '设计阶段',
        percentage: 40,
        status: 'in_progress',
        completionPercentage: 50,
      },
      {
        id: 'stage3',
        name: '开发阶段',
        percentage: 30,
        status: 'pending',
        completionPercentage: 0,
      },
      {
        id: 'stage4',
        name: '测试验收',
        percentage: 10,
        status: 'pending',
        completionPercentage: 0,
      },
    ],
  },
  {
    id: '2',
    code: 'PROJ-2024-002',
    name: 'XX电商平台UI设计',
    type: '计件制',
    status: '已确认',
    isPendingEntry: false,
    managerId: 'user2',
    managerName: '王五',
    group: '设计一部',
    bizManager: '李四',
    clientDept: '电商客户部',
    planStartDate: '2024-02-01',
    planEndDate: '2024-05-31',
    progress: 0,
    contractAmount: 300000.0,
    completedAmount: 0,
    acceptedAmount: 0,
    demandCode: 'REQ-2024-001',
    demandName: '电商平台首页设计',
    frameworkId: 'fram1',
    frameworkName: 'XX电商平台主项目',
    laborBudgetTotal: 200000.0,
    laborExpenseTotal: 0,
    travelBudgetTotal: 50000.0,
    travelExpenseTotal: 0,
    outsourceBudgetTotal: 0,
    outsourceExpenseTotal: 0,
    estimatedProfitRate: 16.7,
    actualProfitRate: 0,
    createdBy: 'user2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '3',
    code: 'PROJ-2024-003',
    name: 'XX企业官网设计',
    type: '离岸制',
    status: '进行中',
    isPendingEntry: false,
    managerId: 'user3',
    managerName: '赵六',
    group: '设计二部',
    clientDept: '企业客户部',
    planStartDate: '2024-03-01',
    planEndDate: '2024-12-31',
    progress: 30,
    contractAmount: 800000.0,
    laborBudgetTotal: 400000.0,
    laborExpenseTotal: 120000.0,
    travelBudgetTotal: 0,
    travelExpenseTotal: 0,
    outsourceBudgetTotal: 0,
    outsourceExpenseTotal: 0,
    estimatedProfitRate: 50.0,
    actualProfitRate: 85.0,
    createdBy: 'user3',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
  },
  {
    id: '4',
    code: 'PROJ-2024-004',
    name: 'XX产品品牌设计',
    type: '驻场制',
    status: '待启动',
    isPendingEntry: false,
    managerId: 'user1',
    managerName: '张三',
    group: '设计一部',
    clientDept: '金融客户部',
    planStartDate: '2024-01-15',
    planEndDate: '2024-04-15',
    progress: 0,
    contractAmount: 200000.0,
    laborBudgetTotal: 0,
    laborExpenseTotal: 0,
    travelBudgetTotal: 0,
    travelExpenseTotal: 0,
    outsourceBudgetTotal: 0,
    outsourceExpenseTotal: 0,
    estimatedProfitRate: 0,
    actualProfitRate: 0,
    createdBy: 'user1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '5',
    code: 'PROJ-2024-005',
    name: 'XX系统界面设计',
    type: '项目制',
    status: '待确认',
    isPendingEntry: false,
    managerId: 'user2',
    managerName: '王五',
    group: '设计一部',
    bizManager: '李四',
    clientDept: '企业客户部',
    planStartDate: '2024-04-01',
    planEndDate: '2024-08-31',
    progress: 0,
    contractAmount: 600000.0,
    laborBudgetTotal: 400000.0,
    laborExpenseTotal: 0,
    travelBudgetTotal: 50000.0,
    travelExpenseTotal: 0,
    outsourceBudgetTotal: 0,
    outsourceExpenseTotal: 0,
    estimatedProfitRate: 25.0,
    actualProfitRate: 0,
    createdBy: 'user2',
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z',
  },
  {
    id: '6',
    code: 'PROJ-2024-006',
    name: 'XX已完成项目',
    type: '项目制',
    status: '已归档',
    isPendingEntry: false,
    managerId: 'user1',
    managerName: '张三',
    group: '设计一部',
    bizManager: '李四',
    clientDept: '金融客户部',
    planStartDate: '2023-01-01',
    planEndDate: '2023-12-31',
    actualStartDate: '2023-01-01',
    actualEndDate: '2023-12-31',
    progress: 100,
    contractAmount: 1000000.0,
    laborBudgetTotal: 500000.0,
    laborExpenseTotal: 480000.0,
    travelBudgetTotal: 100000.0,
    travelExpenseTotal: 95000.0,
    outsourceBudgetTotal: 200000.0,
    outsourceExpenseTotal: 200000.0,
    estimatedProfitRate: 20.0,
    actualProfitRate: 22.5,
    createdBy: 'user1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-31T00:00:00Z',
  },
];

// Mock API 函数
export function getProjects(
  params?: any
): Promise<{ data: Project[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredProjects = [...mockProjects];

      // 简单的筛选逻辑
      // 项目/需求：支持模糊搜索项目名称和需求名称
      if (params?.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredProjects = filteredProjects.filter(
          (p) =>
            p.name.toLowerCase().includes(keyword) ||
            (p.demandName && p.demandName.toLowerCase().includes(keyword))
        );
      }
      if (params?.type && params.type.length > 0) {
        filteredProjects = filteredProjects.filter((p) =>
          params.type.includes(p.type)
        );
      }
      if (params?.status && params.status.length > 0) {
        filteredProjects = filteredProjects.filter((p) =>
          params.status.includes(p.status)
        );
      }
      if (params?.group && params.group.length > 0) {
        filteredProjects = filteredProjects.filter((p) =>
          params.group.includes(p.group)
        );
      }
      // 归档项目筛选
      if (!params?.showArchived) {
        filteredProjects = filteredProjects.filter(
          (p) => p.status !== '已归档'
        );
      }

      // 分页
      const current = params?.current || 1;
      const pageSize = params?.pageSize || 10;
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      const paginatedProjects = filteredProjects.slice(start, end);

      resolve({
        data: paginatedProjects,
        total: filteredProjects.length,
      });
    }, 500);
  });
}

export function getProjectById(id: string): Promise<Project> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const project = mockProjects.find((p) => p.id === id);
      if (project) {
        resolve(project);
      } else {
        reject(new Error('项目不存在'));
      }
    }, 300);
  });
}

// 获取项目预算数据
export function getProjectBudgets(projectId: string): Promise<{
  labor: any[];
  travel: any[];
  outsource: any[];
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock 数据
      resolve({
        labor: [],
        travel: [],
        outsource: [],
      });
    }, 200);
  });
}

// 获取项目支出数据
export function getProjectExpenses(projectId: string): Promise<{
  labor: any[];
  travel: any[];
  outsource: any[];
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock 数据
      resolve({
        labor: [],
        travel: [],
        outsource: [],
      });
    }, 200);
  });
}

// 获取项目变更记录
export function getProjectChanges(projectId: string): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock 数据
      resolve([]);
    }, 200);
  });
}
