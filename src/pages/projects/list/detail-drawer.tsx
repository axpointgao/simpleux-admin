/**
 * 项目详情抽屉组件
 */
import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Typography,
  Divider,
  Spin,
  Button,
  Progress,
  Tabs,
  Steps,
  Table,
  Message,
} from '@arco-design/web-react';
import {
  IconArchive,
  IconCheck,
  IconSettings,
} from '@arco-design/web-react/icon';
import {
  Project,
  ProjectStage,
  ProjectBudgetLabor,
  ProjectBudgetTravel,
  ProjectBudgetOutsource,
  ProjectExpenseLabor,
  ProjectExpenseTravel,
  ProjectExpenseOutsource,
  ProjectChange,
} from '@/types';
import {
  getProjectById,
  getProjectBudgets,
  getProjectExpenses,
  getProjectChanges,
} from './mock';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import StageProgressModal from './stage-progress-modal';

const { Title, Text } = Typography;

interface ProjectDetailDrawerProps {
  visible: boolean;
  projectId: string | null;
  onClose: () => void;
  onProjectChange?: (project: Project) => void;
  onDesignConfirm?: (project: Project) => void;
  onArchive?: (project: Project) => void;
  onCancelArchive?: (project: Project) => void;
  onPendingEntry?: (project: Project) => void;
}

function ProjectDetailDrawer({
  visible,
  projectId,
  onClose,
  onProjectChange,
  onDesignConfirm,
  onArchive,
  onCancelArchive,
  onPendingEntry,
}: ProjectDetailDrawerProps) {
  const history = useHistory();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [laborBudgetData, setLaborBudgetData] = useState<ProjectBudgetLabor[]>(
    []
  );
  const [laborExpenseData, setLaborExpenseData] = useState<
    ProjectExpenseLabor[]
  >([]);
  const [travelBudgetData, setTravelBudgetData] = useState<
    ProjectBudgetTravel[]
  >([]);
  const [travelExpenseData, setTravelExpenseData] = useState<
    ProjectExpenseTravel[]
  >([]);
  const [outsourceBudgetData, setOutsourceBudgetData] = useState<
    ProjectBudgetOutsource[]
  >([]);
  const [outsourceExpenseData, setOutsourceExpenseData] = useState<
    ProjectExpenseOutsource[]
  >([]);
  const [changeData, setChangeData] = useState<ProjectChange[]>([]);

  useEffect(() => {
    if (visible && projectId) {
      fetchProjectDetail();
    } else {
      setProject(null);
    }
  }, [visible, projectId]);

  async function fetchProjectDetail() {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getProjectById(projectId);
      setProject(data);

      // 获取预算和支出数据
      if (data) {
        const [budgets, expenses, changes] = await Promise.all([
          getProjectBudgets(projectId),
          getProjectExpenses(projectId),
          getProjectChanges(projectId),
        ]);

        setLaborBudgetData(budgets.labor || []);
        setTravelBudgetData(budgets.travel || []);
        setOutsourceBudgetData(budgets.outsource || []);
        setLaborExpenseData(expenses.labor || []);
        setTravelExpenseData(expenses.travel || []);
        setOutsourceExpenseData(expenses.outsource || []);
        setChangeData(changes || []);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!project && !loading) {
    return null;
  }

  // 计算剩余天数或超期天数（仅项目制/计件制，离岸制/驻场制计划日期非必填）
  const getDaysInfo = () => {
    if (!project) return { text: '', isOverdue: false };
    // 离岸制/驻场制计划日期非必填，不计算剩余天数
    if (project.type === '离岸制' || project.type === '驻场制') {
      return { text: '', isOverdue: false };
    }
    if (!project.planEndDate) return { text: '', isOverdue: false };
    const end = dayjs(project.planEndDate);
    const now = dayjs();
    const days = end.diff(now, 'day');
    const isOverdue = days < 0;
    const text = isOverdue ? `超期${Math.abs(days)}天` : `剩余${days}天`;
    return { text, isOverdue };
  };

  const daysInfo = getDaysInfo();

  // 项目状态颜色映射
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      待启动: 'gray',
      进行中: 'blue',
      待确认: 'orange',
      已确认: 'green',
      已归档: '#86909c',
    };
    return statusMap[status] || 'gray';
  };

  // 项目类型颜色映射
  const getTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      项目制: 'blue',
      计件制: 'green',
      离岸制: 'orange',
      驻场制: 'purple',
    };
    return typeMap[type] || 'gray';
  };

  // 格式化金额（万元）
  const formatAmount = (amount?: number) => {
    if (!amount || amount === 0) return '-';
    return `¥${(amount / 10000).toFixed(2)}万`;
  };

  // 格式化利润率
  const formatProfitRate = (rate?: number) => {
    if (rate === undefined || rate === null) return '-';
    return `${rate.toFixed(1)}%`;
  };

  // 获取项目显示名称（计件制显示需求名称，其他显示项目名称）
  const getProjectDisplayName = () => {
    if (!project) return '';
    if (project.type === '计件制' && project.demandName) {
      return project.demandName;
    }
    return project.name;
  };

  // 计算整体进度（基于阶段完成情况）
  const calculateOverallProgress = () => {
    if (!project || !project.stages || project.stages.length === 0) {
      return project?.progress || 0;
    }
    // 根据阶段完成情况计算整体进度
    let totalProgress = 0;
    project.stages.forEach((stage) => {
      totalProgress += (stage.percentage * stage.completionPercentage) / 100;
    });
    return Math.round(totalProgress);
  };

  const overallProgress = calculateOverallProgress();

  // 获取阶段步骤数据
  const getStageSteps = () => {
    if (!project || !project.stages || project.stages.length === 0) {
      return [];
    }
    return project.stages.map((stage, index) => {
      let status: 'wait' | 'process' | 'finish' = 'wait';
      if (stage.status === 'completed') {
        status = 'finish';
      } else if (stage.status === 'in_progress') {
        status = 'process';
      }
      return {
        title: stage.name,
        description: `${stage.percentage}% | 完成度: ${stage.completionPercentage}%`,
        status,
      };
    });
  };

  // 处理更新进度
  const handleUpdateProgress = () => {
    if (project && project.stages && project.stages.length > 0) {
      setStageModalVisible(true);
    } else {
      Message.warning('项目暂无阶段信息');
    }
  };

  // 处理阶段进度确认
  const handleStageProgressConfirm = async (updatedStages: ProjectStage[]) => {
    if (!project) return;
    try {
      // TODO: 调用API更新阶段进度
      console.log('更新阶段进度:', updatedStages);

      // 更新项目数据
      setProject({
        ...project,
        stages: updatedStages,
        progress: updatedStages.reduce((sum, stage) => {
          return sum + (stage.percentage * stage.completionPercentage) / 100;
        }, 0),
      });

      Message.success('进度更新成功');
      setStageModalVisible(false);
    } catch (error) {
      console.error('更新进度失败:', error);
      Message.error('更新进度失败，请重试');
    }
  };

  // 人力预算表格列（严格按照数据库表结构：project_budgets_labor）
  // 注意：dataIndex 使用 camelCase（与 TypeScript 接口一致），但对应数据库字段为 snake_case
  const laborBudgetColumns = [
    {
      title: '员工级别',
      dataIndex: 'employeeLevel', // 对应数据库字段：employee_level (text, NOT NULL)
      width: 120,
    },
    {
      title: '城市类型',
      dataIndex: 'cityType', // 对应数据库字段：city_type (text, NOT NULL)
      width: 100,
      render: (v: string) => (v === 'Chengdu' ? '成都' : '杭州'),
    },
    {
      title: '人日数',
      dataIndex: 'days', // 对应数据库字段：days (numeric(10,2), NOT NULL)
      width: 100,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '单价（元/人日）',
      dataIndex: 'unitCost', // 对应数据库字段：unit_cost (numeric(10,2), NOT NULL)
      width: 120,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '总价（元）',
      dataIndex: 'totalCost', // 对应数据库字段：total_cost (numeric(15,2), NOT NULL) = days * unit_cost
      width: 120,
      render: (v: number) => formatAmount(v),
    },
  ];

  // 人力支出表格列（严格按照数据库表结构：project_expenses_labor）
  // 注意：dataIndex 使用 camelCase（与 TypeScript 接口一致），但对应数据库字段为 snake_case
  const laborExpenseColumns = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName', // 对应数据库字段：employee_name (text, NOT NULL)
      width: 120,
    },
    {
      title: '员工级别',
      dataIndex: 'employeeLevel', // 对应数据库字段：employee_level (text, NOT NULL)
      width: 100,
    },
    {
      title: '工作日期',
      dataIndex: 'workDate', // 对应数据库字段：work_date (date, NOT NULL)
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '月份',
      dataIndex: 'month', // 计算字段：从 workDate 提取的月份 (YYYY-MM)，用于统计展示，不在数据库表中
      width: 100,
      render: (v?: string) => v || '-',
    },
    {
      title: '计划工时（小时）',
      dataIndex: 'plannedHours', // 可选字段，用于对比，不在数据库表中
      width: 120,
      render: (v?: number) => (v ? v.toFixed(2) : '-'),
    },
    {
      title: '实际工时（小时）',
      dataIndex: 'hours', // 对应数据库字段：hours (numeric(10,2), NOT NULL)
      width: 120,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '计算成本（元）',
      dataIndex: 'calculatedCost', // 对应数据库字段：calculated_cost (numeric(15,2), NOT NULL) = hours/8 * daily_cost
      width: 120,
      render: (v: number) => formatAmount(v),
    },
  ];

  // 差旅预算表格列（严格按照数据库表结构：project_budgets_travel）
  const travelBudgetColumns = [
    { title: '差旅事项', dataIndex: 'item', width: 200 }, // item
    {
      title: '大交通（元）',
      dataIndex: 'transportBig',
      width: 100,
      render: (v: number) => formatAmount(v), // transport_big (numeric(10,2), DEFAULT 0)
    },
    {
      title: '住宿（元）',
      dataIndex: 'stay',
      width: 100,
      render: (v: number) => formatAmount(v), // stay (numeric(10,2), DEFAULT 0)
    },
    {
      title: '小交通（元）',
      dataIndex: 'transportSmall',
      width: 100,
      render: (v: number) => formatAmount(v), // transport_small (numeric(10,2), DEFAULT 0)
    },
    {
      title: '补助（元）',
      dataIndex: 'allowance',
      width: 100,
      render: (v: number) => formatAmount(v), // allowance (numeric(10,2), DEFAULT 0)
    },
    {
      title: '其他（元）',
      dataIndex: 'other',
      width: 100,
      render: (v: number) => formatAmount(v), // other (numeric(10,2), DEFAULT 0)
    },
    {
      title: '总价（元）',
      dataIndex: 'totalCost',
      width: 120,
      render: (v: number) => formatAmount(v), // total_cost (numeric(15,2)) = 各项费用之和
    },
  ];

  // 差旅支出表格列（严格按照数据库表结构：project_expenses_travel）
  const travelExpenseColumns = [
    { title: '差旅事项', dataIndex: 'item', width: 150 }, // item
    {
      title: '支出日期',
      dataIndex: 'expenseDate',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'), // expense_date (date)
    },
    {
      title: '月份',
      dataIndex: 'month',
      width: 100,
      render: (v?: string) => v || '-', // 从 expenseDate 提取的月份 (YYYY-MM)
    },
    {
      title: '大交通',
      dataIndex: 'transportBig',
      width: 100,
      render: (v: number) => formatAmount(v), // transport_big (numeric(10,2))
    },
    {
      title: '住宿',
      dataIndex: 'stay',
      width: 100,
      render: (v: number) => formatAmount(v), // stay (numeric(10,2))
    },
    {
      title: '小交通',
      dataIndex: 'transportSmall',
      width: 100,
      render: (v: number) => formatAmount(v), // transport_small (numeric(10,2))
    },
    {
      title: '补助',
      dataIndex: 'allowance',
      width: 100,
      render: (v: number) => formatAmount(v), // allowance (numeric(10,2))
    },
    {
      title: '其他',
      dataIndex: 'other',
      width: 100,
      render: (v: number) => formatAmount(v), // other (numeric(10,2))
    },
    {
      title: '总金额（元）',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v: number) => formatAmount(v), // total_amount (numeric(15,2))
    },
  ];

  // 外包预算表格列（严格按照数据库表结构：project_budgets_outsource）
  const outsourceBudgetColumns = [
    { title: '外包事项', dataIndex: 'item', width: 200 }, // item
    { title: '供应商', dataIndex: 'supplierName', width: 150 }, // supplier_name (可为NULL)
    {
      title: '金额（元）',
      dataIndex: 'amount',
      width: 120,
      render: (v: number) => formatAmount(v), // amount (numeric(15,2))
    },
  ];

  // 外包支出表格列（严格按照数据库表结构：project_expenses_outsource）
  const outsourceExpenseColumns = [
    { title: '外包事项', dataIndex: 'item', width: 150 }, // item
    { title: '供应商', dataIndex: 'supplierName', width: 150 }, // supplier_name (可为NULL)
    {
      title: '支出日期',
      dataIndex: 'expenseDate',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'), // expense_date (date)
    },
    {
      title: '月份',
      dataIndex: 'month',
      width: 100,
      render: (v?: string) => v || '-', // 从 expenseDate 提取的月份 (YYYY-MM)
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      width: 120,
      render: (v: number) => formatAmount(v), // amount (numeric(15,2))
    },
  ];

  // 变更记录表格列（严格按照数据库表结构：project_changes）
  const changeColumns = [
    {
      title: '变更日期',
      dataIndex: 'changeDate',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'), // change_date (date, NOT NULL)
    },
    {
      title: '变更类型',
      dataIndex: 'changeType',
      width: 100,
      render: (v: string) => (v === 'project' ? '项目变更' : '需求变更'), // change_type (project/demand, NOT NULL)
    },
    { title: '变更说明', dataIndex: 'description', width: 200 }, // description (text, NOT NULL)
    {
      title: '变更金额',
      dataIndex: 'contractAmount',
      width: 120,
      render: (v?: number) => (v ? formatAmount(v) : '-'), // contract_amount (numeric(15,2), 可为NULL)
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      width: 100,
      render: (v: string) => {
        // 审批状态从关联的审批记录获取（approval_id → approvals表）
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: '待审批', color: 'orange' },
          approved: { text: '已通过', color: 'green' },
          rejected: { text: '已拒绝', color: 'red' },
        };
        const config = statusMap[v] || { text: v, color: 'gray' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  return (
    <Drawer
      width={900}
      title={
        <Space>
          <Title heading={6} style={{ margin: 0 }}>
            {getProjectDisplayName()}
          </Title>
          {project && (
            <>
              <Tag color={getTypeColor(project.type)}>{project.type}</Tag>
              <Tag color={getStatusColor(project.status)}>{project.status}</Tag>
            </>
          )}
        </Space>
      }
      visible={visible}
      onCancel={onClose}
      footer={
        project && (
          <Space>
            {/* 项目变更：非归档、非待补录标记的项目 */}
            {project.status !== '已归档' && !project.isPendingEntry && (
              <Button
                type="primary"
                icon={<IconSettings />}
                onClick={() => {
                  history.push(`/projects/change?id=${project.id}`);
                }}
              >
                项目变更
              </Button>
            )}
            {/* 发起设计确认：进行中/待确认、非离岸制/驻场制项目
                待补录标记的项目如果状态是"进行中"或"待确认"也可以发起设计确认 */}
            {(project.status === '进行中' || project.status === '待确认') &&
              project.type !== '离岸制' &&
              project.type !== '驻场制' && (
                <Button
                  icon={<IconCheck />}
                  onClick={() => onDesignConfirm?.(project)}
                >
                  发起设计确认
                </Button>
              )}
            {/* 发起归档：已确认项目，且待补录标记的项目需先完成补录申请 */}
            {project.status === '已确认' && !project.isPendingEntry && (
              <Button
                icon={<IconArchive />}
                onClick={() => onArchive?.(project)}
              >
                发起归档
              </Button>
            )}
            {/* 取消归档：已归档的项目可以取消归档 */}
            {project.status === '已归档' && (
              <Button onClick={() => onCancelArchive?.(project)}>
                取消归档
              </Button>
            )}
            {/* 提交补录申请：待补录标记的项目（已归档除外） */}
            {project.isPendingEntry && project.status !== '已归档' && (
              <Button
                onClick={() => {
                  history.push(`/projects/pending-entry?id=${project.id}`);
                }}
              >
                提交补录申请
              </Button>
            )}
          </Space>
        )
      }
    >
      <Spin loading={loading} style={{ width: '100%' }}>
        {project && (
          <Tabs defaultActiveTab="info">
            {/* 项目信息选项卡 */}
            <Tabs.TabPane key="info" title="项目信息">
              {/* 基本信息 - 一行4列 */}
              <Title heading={6} style={{ marginTop: 0 }}>
                基本信息
              </Title>
              <Descriptions
                column={4}
                data={[
                  {
                    label: '项目经理',
                    value: project.managerName,
                  },
                  {
                    label: '归属部门',
                    value: project.group,
                  },
                  {
                    label: '商务经理',
                    value: project.bizManager || '-',
                  },
                  {
                    label: '客户部', // 对应数据库 client_dept (text, NULL)
                    value: project.clientDept || '-',
                  },
                  {
                    label: '计划开始日期',
                    value: project.planStartDate || '-',
                  },
                  {
                    label: '计划结束日期',
                    value: project.planEndDate || '-',
                  },
                  {
                    label: '实际开始日期',
                    value: project.actualStartDate || '-',
                  },
                  {
                    label: '实际结束日期',
                    value: project.actualEndDate || '-',
                  },
                ]}
                style={{ marginBottom: 24 }}
              />

              {/* 计件制项目特殊字段 */}
              {project.type === '计件制' && (
                <>
                  <Divider />
                  <Title heading={6}>计件制项目信息</Title>
                  <Descriptions
                    column={4}
                    data={[
                      {
                        label: '需求编号',
                        value: project.demandCode || '-',
                      },
                      {
                        label: '需求名称',
                        value: project.demandName || '-',
                      },
                      {
                        label: '计件项目',
                        value: project.frameworkName || '-',
                      },
                    ]}
                    style={{ marginBottom: 24 }}
                  />
                </>
              )}

              {/* 进度栏 - 步骤条（仅项目制/计件制显示） */}
              {(project.type === '项目制' || project.type === '计件制') && (
                <>
                  <Divider />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Space>
                      <Title heading={6} style={{ margin: 0 }}>
                        进度
                      </Title>
                      {daysInfo.text && (
                        <Text
                          style={{
                            color: daysInfo.isOverdue ? '#f53f3f' : '#86909c',
                          }}
                        >
                          {daysInfo.text}
                        </Text>
                      )}
                    </Space>
                    {/* 更新进度按钮：已归档项目不显示 */}
                    {project.status !== '已归档' && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleUpdateProgress}
                      >
                        更新进度
                      </Button>
                    )}
                  </div>
                  {project.stages && project.stages.length > 0 ? (
                    <div style={{ marginBottom: 24 }}>
                      <Steps
                        current={
                          project.stages.findIndex(
                            (s) => s.status === 'in_progress'
                          ) >= 0
                            ? project.stages.findIndex(
                                (s) => s.status === 'in_progress'
                              )
                            : project.stages.length
                        }
                        style={{ marginBottom: 16 }}
                      >
                        {getStageSteps().map((step, index) => (
                          <Steps.Step
                            key={index}
                            title={step.title}
                            description={step.description}
                            status={step.status}
                          />
                        ))}
                      </Steps>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                        }}
                      >
                        <Text>整体进度：</Text>
                        <Progress
                          percent={overallProgress}
                          style={{ flex: 1 }}
                        />
                        <Text>{overallProgress}%</Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                        }}
                      >
                        <Text>整体进度：</Text>
                        <Progress
                          percent={project.progress}
                          style={{ flex: 1 }}
                        />
                        <Text>{project.progress}%</Text>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 财务信息（离岸制/驻场制不显示财务汇总信息） */}
              {(project.type === '项目制' || project.type === '计件制') && (
                <>
                  <Divider />
                  <Title heading={6}>财务信息</Title>
                  <Descriptions
                    column={2}
                    data={[
                      {
                        label: '业绩金额',
                        value: (
                          <Text style={{ fontSize: 16, fontWeight: 600 }}>
                            {formatAmount(project.contractAmount)}
                          </Text>
                        ),
                      },
                      {
                        label: '预估利润率',
                        value: formatProfitRate(project.estimatedProfitRate),
                      },
                      {
                        label: '完成金额',
                        value: formatAmount(project.completedAmount),
                      },
                      {
                        label: '实际利润率',
                        value: (
                          <Text
                            style={{
                              color:
                                (project.actualProfitRate || 0) >=
                                (project.estimatedProfitRate || 0)
                                  ? '#00b42a'
                                  : '#86909c',
                            }}
                          >
                            {formatProfitRate(project.actualProfitRate)}
                          </Text>
                        ),
                      },
                      {
                        label: '验收金额',
                        value: formatAmount(project.acceptedAmount),
                      },
                      {
                        label: '',
                        value: '',
                      },
                      {
                        label: '人力预算',
                        value: formatAmount(project.laborBudgetTotal),
                      },
                      {
                        label: '人力支出',
                        value: formatAmount(project.laborExpenseTotal),
                      },
                      {
                        label: '差旅预算',
                        value: formatAmount(project.travelBudgetTotal),
                      },
                      {
                        label: '差旅支出',
                        value: formatAmount(project.travelExpenseTotal),
                      },
                      {
                        label: '外包预算',
                        value: formatAmount(project.outsourceBudgetTotal),
                      },
                      {
                        label: '外包支出',
                        value: formatAmount(project.outsourceExpenseTotal),
                      },
                    ]}
                    style={{ marginBottom: 24 }}
                  />
                </>
              )}

              {/* 其他信息 */}
              <Divider />
              <Title heading={6}>其他信息</Title>
              <Descriptions
                column={2}
                data={[
                  // 只有待补录标记为true时才显示待补录标记
                  ...(project.isPendingEntry
                    ? [
                        {
                          label: '待补录标记',
                          value: <Tag color="orange">待补录</Tag>,
                        },
                      ]
                    : []),
                  {
                    label: '创建时间',
                    value: dayjs(project.createdAt).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ),
                  },
                  {
                    label: '更新时间',
                    value: dayjs(project.updatedAt).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ),
                  },
                ]}
              />
            </Tabs.TabPane>

            {/* 人力明细选项卡（离岸制/驻场制不显示预算，但可以显示支出） */}
            <Tabs.TabPane key="labor" title="人力明细">
              {/* 人力预算：仅项目制/计件制显示 */}
              {(project.type === '项目制' || project.type === '计件制') && (
                <div style={{ marginBottom: 24 }}>
                  <Title heading={6} style={{ marginBottom: 16 }}>
                    人力预算
                  </Title>
                  <Table
                    columns={laborBudgetColumns}
                    data={laborBudgetData}
                    pagination={false}
                    noDataElement="暂无数据"
                  />
                </div>
              )}
              {/* 人力支出：所有类型都可以显示 */}
              <div>
                <Title heading={6} style={{ marginBottom: 16 }}>
                  人力支出
                </Title>
                <Table
                  columns={laborExpenseColumns}
                  data={laborExpenseData}
                  pagination={false}
                  noDataElement="暂无数据"
                />
              </div>
            </Tabs.TabPane>

            {/* 差旅明细选项卡（离岸制/驻场制不显示预算，但可以显示支出） */}
            <Tabs.TabPane key="travel" title="差旅明细">
              {/* 差旅预算：仅项目制/计件制显示 */}
              {(project.type === '项目制' || project.type === '计件制') && (
                <div style={{ marginBottom: 24 }}>
                  <Title heading={6} style={{ marginBottom: 16 }}>
                    差旅预算
                  </Title>
                  <Table
                    columns={travelBudgetColumns}
                    data={travelBudgetData}
                    pagination={false}
                    noDataElement="暂无数据"
                  />
                </div>
              )}
              {/* 差旅支出：所有类型都可以显示 */}
              <div>
                <Title heading={6} style={{ marginBottom: 16 }}>
                  差旅支出
                </Title>
                <Table
                  columns={travelExpenseColumns}
                  data={travelExpenseData}
                  pagination={false}
                  noDataElement="暂无数据"
                />
              </div>
            </Tabs.TabPane>

            {/* 外包明细选项卡（离岸制/驻场制不显示预算，但可以显示支出） */}
            <Tabs.TabPane key="outsource" title="外包明细">
              {/* 外包预算：仅项目制/计件制显示 */}
              {(project.type === '项目制' || project.type === '计件制') && (
                <div style={{ marginBottom: 24 }}>
                  <Title heading={6} style={{ marginBottom: 16 }}>
                    外包预算
                  </Title>
                  <Table
                    columns={outsourceBudgetColumns}
                    data={outsourceBudgetData}
                    pagination={false}
                    noDataElement="暂无数据"
                  />
                </div>
              )}
              {/* 外包支出：所有类型都可以显示 */}
              <div>
                <Title heading={6} style={{ marginBottom: 16 }}>
                  外包支出
                </Title>
                <Table
                  columns={outsourceExpenseColumns}
                  data={outsourceExpenseData}
                  pagination={false}
                  noDataElement="暂无数据"
                />
              </div>
            </Tabs.TabPane>

            {/* 变更记录选项卡 */}
            <Tabs.TabPane key="changes" title="变更记录">
              <Table
                columns={changeColumns}
                data={changeData}
                pagination={false}
                noDataElement="暂无数据"
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Spin>

      {/* 阶段进度管理弹窗 */}
      {project && project.stages && (
        <StageProgressModal
          visible={stageModalVisible}
          stages={project.stages}
          onClose={() => setStageModalVisible(false)}
          onConfirm={handleStageProgressConfirm}
        />
      )}
    </Drawer>
  );
}

export default ProjectDetailDrawer;
