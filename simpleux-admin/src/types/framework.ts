/**
 * 计件项目相关类型定义
 */

// 计件项目
export interface FrameworkAgreement {
  id: string; // uuid
  code: string; // 计件项目编号（FRAM-YYYYMMDD-XXXX，自动生成，不在UI中显示）
  name: string; // 主项目名称
  managerId: string; // 项目经理ID (uuid, FK → profiles.id, NOT NULL)
  managerName: string; // 项目经理
  bizManager?: string; // 商务经理
  group: string; // 归属部门
  clientDept?: string; // 客户部
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  createdBy: string; // 创建人ID
  updatedBy?: string; // 更新人ID
}
