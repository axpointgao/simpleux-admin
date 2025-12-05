/**
 * 项目归档弹窗
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Message,
  Alert,
  Descriptions,
  Divider,
  Typography,
  Grid,
} from '@arco-design/web-react';
import { Project } from '@/types';

const { Title } = Typography;
const { Row, Col } = Grid;

interface ArchiveModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (data: { description?: string }) => Promise<void>;
}

function ArchiveModal({
  visible,
  project,
  onClose,
  onConfirm,
}: ArchiveModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [budgetCheckResult, setBudgetCheckResult] = useState<{
    laborBudgetTotal: number;
    laborExpenseTotal: number;
    travelBudgetTotal: number;
    travelExpenseTotal: number;
    outsourceBudgetTotal: number;
    outsourceExpenseTotal: number;
  } | null>(null);

  useEffect(() => {
    if (visible && project) {
      form.resetFields();
      // 加载预算和支出数据用于计算财务指标
      loadBudgetAndExpense();
    }
  }, [visible, project, form]);

  // 加载预算与支出数据（仅用于计算财务指标）
  async function loadBudgetAndExpense() {
    if (!project) return;

    setDataLoading(true);
    try {
      // 动态导入，避免循环依赖
      const { getProjectBudgets, getProjectExpenses } = await import('./mock');
      const [budgets, expenses] = await Promise.all([
        getProjectBudgets(project.id),
        getProjectExpenses(project.id),
      ]);

      const laborBudgetTotal =
        budgets.labor?.reduce(
          (sum: number, item: any) => sum + (item.totalCost || 0),
          0
        ) || 0;
      const laborExpenseTotal =
        expenses.labor?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const travelBudgetTotal =
        budgets.travel?.reduce(
          (sum: number, item: any) => sum + (item.totalCost || 0),
          0
        ) || 0;
      const travelExpenseTotal =
        expenses.travel?.reduce(
          (sum: number, item: any) => sum + (item.totalAmount || 0),
          0
        ) || 0;
      const outsourceBudgetTotal =
        budgets.outsource?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const outsourceExpenseTotal =
        expenses.outsource?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;

      setBudgetCheckResult({
        laborBudgetTotal,
        laborExpenseTotal,
        travelBudgetTotal,
        travelExpenseTotal,
        outsourceBudgetTotal,
        outsourceExpenseTotal,
      });
    } catch (error) {
      console.error('加载预算与支出数据失败:', error);
      Message.error('加载预算与支出数据失败');
    } finally {
      setDataLoading(false);
    }
  }

  // 格式化金额（与详情页保持一致）
  function formatAmount(amount: number | undefined): string {
    if (!amount || amount === 0) return '-';
    const wan = amount / 10000;
    return `¥${wan.toFixed(2)}万`;
  }

  // 格式化利润率
  function formatProfitRate(rate: number | undefined): string {
    if (rate === undefined || rate === null) return '-';
    return `${rate.toFixed(2)}%`;
  }

  // 计算实际利润
  function calculateActualProfit(): number {
    if (!project || !budgetCheckResult) return 0;
    const contractAmount = project.contractAmount || 0;
    const totalExpense =
      budgetCheckResult.laborExpenseTotal +
      budgetCheckResult.travelExpenseTotal +
      budgetCheckResult.outsourceExpenseTotal;
    return contractAmount - totalExpense;
  }

  // 计算实际利润率
  function calculateActualProfitRate(): number {
    if (!project || !budgetCheckResult) return 0;
    const contractAmount = project.contractAmount || 0;
    if (contractAmount === 0) return 0;
    const profit = calculateActualProfit();
    return (profit / contractAmount) * 100;
  }

  // 提交归档申请
  const handleSubmit = async () => {
    try {
      const values = await form.validate();

      setLoading(true);
      await onConfirm({
        description: values.description,
      });
      Message.success('归档申请提交成功');
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
      if (error?.fields) {
        // 表单验证错误已在Form组件中显示
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // 计算实际利润和利润率
  const actualProfit = budgetCheckResult ? calculateActualProfit() : 0;
  const actualProfitRate = budgetCheckResult ? calculateActualProfitRate() : 0;

  return (
    <Modal
      title="发起归档"
      visible={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      style={{ width: 800 }}
      getPopupContainer={() => document.body}
      maskStyle={{ zIndex: 3000 }}
      wrapStyle={{ zIndex: 3000 }}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* 项目信息 - 一行显示 */}
        <div style={{ marginBottom: 24, color: 'var(--color-text-2)' }}>
          <span>
            项目名称：
            {project?.type === '计件制'
              ? project?.frameworkName || '-'
              : project?.name || '-'}
          </span>
          {project?.type === '计件制' && (
            <span style={{ marginLeft: 32 }}>
              需求名称：{project?.demandName || '-'}
            </span>
          )}
        </div>

        {/* 财务指标 - 重点突出 */}
        {budgetCheckResult && (
          <>
            <Divider />
            <Title heading={6} style={{ marginBottom: 16 }}>
              财务指标
            </Title>
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-2)',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-3)',
                      marginBottom: 8,
                    }}
                  >
                    业绩金额
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: 'var(--color-text-1)',
                    }}
                  >
                    {formatAmount(project?.contractAmount)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-2)',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-3)',
                      marginBottom: 8,
                    }}
                  >
                    实际利润
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color:
                        actualProfit >= 0
                          ? 'var(--color-success-6)'
                          : 'var(--color-danger-6)',
                    }}
                  >
                    {formatAmount(actualProfit)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-2)',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-3)',
                      marginBottom: 8,
                    }}
                  >
                    实际利润率
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color:
                        actualProfitRate >= 0
                          ? 'var(--color-success-6)'
                          : 'var(--color-danger-6)',
                    }}
                  >
                    {formatProfitRate(actualProfitRate)}
                  </div>
                </div>
              </Col>
            </Row>

            {/* 预算与支出明细 */}
            <Title heading={6} style={{ marginBottom: 16 }}>
              预算与支出明细
            </Title>
            <Descriptions
              column={2}
              data={[
                {
                  label: '人力预算',
                  value: formatAmount(budgetCheckResult.laborBudgetTotal),
                },
                {
                  label: '人力支出',
                  value: formatAmount(budgetCheckResult.laborExpenseTotal),
                },
                {
                  label: '差旅预算',
                  value: formatAmount(budgetCheckResult.travelBudgetTotal),
                },
                {
                  label: '差旅支出',
                  value: formatAmount(budgetCheckResult.travelExpenseTotal),
                },
                {
                  label: '外包预算',
                  value: formatAmount(budgetCheckResult.outsourceBudgetTotal),
                },
                {
                  label: '外包支出',
                  value: formatAmount(budgetCheckResult.outsourceExpenseTotal),
                },
                {
                  label: '总预算',
                  value: formatAmount(
                    budgetCheckResult.laborBudgetTotal +
                      budgetCheckResult.travelBudgetTotal +
                      budgetCheckResult.outsourceBudgetTotal
                  ),
                },
                {
                  label: '总支出',
                  value: formatAmount(
                    budgetCheckResult.laborExpenseTotal +
                      budgetCheckResult.travelExpenseTotal +
                      budgetCheckResult.outsourceExpenseTotal
                  ),
                },
              ]}
              style={{ marginBottom: 24 }}
            />
          </>
        )}

        {/* 固定提示 */}
        <Alert
          type="warning"
          content="请确定差旅和外包支出都已录入后再进行归档"
          style={{ marginBottom: 24 }}
        />

        <Form.Item label="归档说明" field="description" rules={[]}>
          <Input.TextArea
            placeholder="请输入归档说明（可选）"
            rows={4}
            maxLength={500}
            showWordLimit
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ArchiveModal;
