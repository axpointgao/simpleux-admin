/**
 * 项目相关公共常量
 */

// 人力成本矩阵（从配置中获取）
export const COST_MATRIX: Record<string, Record<string, number>> = {
  P5: { Chengdu: 1000, Hangzhou: 1400 },
  P6: { Chengdu: 1500, Hangzhou: 2000 },
  P7: { Chengdu: 2200, Hangzhou: 2800 },
  P8: { Chengdu: 3000, Hangzhou: 3800 },
  M1: { Chengdu: 2500, Hangzhou: 3200 },
  M2: { Chengdu: 3500, Hangzhou: 4500 },
};

// 员工级别选项
export const EMPLOYEE_LEVELS = ['P5', 'P6', 'P7', 'P8', 'M1', 'M2'];

// 城市类型选项
export const CITY_TYPES = [
  { label: '成都', value: 'Chengdu' },
  { label: '杭州', value: 'Hangzhou' },
];

// Mock 供应商数据
export const SUPPLIERS = [
  { id: 'supplier1', name: '供应商A' },
  { id: 'supplier2', name: '供应商B' },
  { id: 'supplier3', name: '供应商C' },
];

// 项目经理名称映射
export const MANAGER_NAME_MAP: Record<string, string> = {
  user1: '张三',
  user2: '李四',
  user3: '王五',
};

// 获取项目经理名称
export function getManagerName(managerId: string): string {
  return MANAGER_NAME_MAP[managerId] || managerId;
}
