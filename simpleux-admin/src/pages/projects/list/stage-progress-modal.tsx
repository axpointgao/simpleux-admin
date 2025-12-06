/**
 * 阶段进度管理弹窗
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Upload,
  Button,
  Space,
  Message,
  Table,
  Checkbox,
  Slider,
} from '@arco-design/web-react';
import { ProjectStage } from '@/types';
import dayjs from 'dayjs';

interface StageProgressModalProps {
  visible: boolean;
  stages: ProjectStage[];
  onClose: () => void;
  onConfirm: (stages: ProjectStage[]) => Promise<void>;
}

function StageProgressModal({
  visible,
  stages,
  onClose,
  onConfirm,
}: StageProgressModalProps) {
  const [form] = Form.useForm();
  const [localStages, setLocalStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && stages) {
      setLocalStages([...stages]);
      form.setFieldsValue({
        stages: stages.map((s) => ({
          status: s.status,
          completionPercentage: s.completionPercentage,
          attachmentUrl: s.attachmentUrl,
        })),
      });
    }
  }, [visible, stages, form]);

  // 处理阶段状态变更
  const handleStageStatusChange = (
    index: number,
    status: 'pending' | 'in_progress' | 'completed'
  ) => {
    const newStages = [...localStages];
    newStages[index] = {
      ...newStages[index],
      status,
      // 如果标记为完成，完成百分比自动为100
      completionPercentage:
        status === 'completed' ? 100 : newStages[index].completionPercentage,
    };
    setLocalStages(newStages);
    form.setFieldValue(`stages.${index}.status`, status);
    if (status === 'completed') {
      form.setFieldValue(`stages.${index}.completionPercentage`, 100);
    }
  };

  // 处理完成百分比变更
  const handleCompletionPercentageChange = (index: number, value: number) => {
    const newStages = [...localStages];
    newStages[index] = {
      ...newStages[index],
      completionPercentage: value,
      // 如果完成百分比为100，自动标记为完成
      status:
        value === 100
          ? 'completed'
          : newStages[index].status === 'completed'
          ? 'in_progress'
          : newStages[index].status,
    };
    setLocalStages(newStages);
    form.setFieldValue(`stages.${index}.completionPercentage`, value);
    if (value === 100) {
      form.setFieldValue(`stages.${index}.status`, 'completed');
    }
  };

  // 处理附件上传
  const handleAttachmentChange = (index: number, fileList: any[]) => {
    const newStages = [...localStages];
    newStages[index] = {
      ...newStages[index],
      attachmentUrl:
        fileList.length > 0
          ? fileList[0].url || fileList[0].response?.url
          : undefined,
    };
    setLocalStages(newStages);
    form.setFieldValue(
      `stages.${index}.attachmentUrl`,
      newStages[index].attachmentUrl
    );
  };

  // 提交
  const handleSubmit = async () => {
    try {
      await form.validate();
      setLoading(true);
      // 更新阶段数据
      const updatedStages = localStages.map((stage, index) => {
        const formValues = form.getFieldValue(`stages.${index}`);
        return {
          ...stage,
          status: formValues.status || stage.status,
          completionPercentage:
            formValues.completionPercentage ?? stage.completionPercentage,
          attachmentUrl: formValues.attachmentUrl || stage.attachmentUrl,
          // 如果标记为完成，记录完成时间和完成人
          completedAt:
            formValues.status === 'completed' && stage.status !== 'completed'
              ? dayjs().format('YYYY-MM-DD HH:mm:ss')
              : stage.completedAt,
          completedBy:
            formValues.status === 'completed' && stage.status !== 'completed'
              ? 'current_user_id' // TODO: 从用户上下文获取
              : stage.completedBy,
        };
      });
      await onConfirm(updatedStages);
      Message.success('进度更新成功');
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '阶段名称',
      dataIndex: 'name',
      width: 150,
      render: (_: any, record: ProjectStage) => record.name,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      width: 80,
      render: (_: any, record: ProjectStage) => `${record.percentage}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_: any, record: ProjectStage, index: number) => {
        return (
          <Space>
            <Checkbox
              checked={record.status === 'in_progress'}
              onChange={(checked) => {
                if (checked) {
                  handleStageStatusChange(index, 'in_progress');
                } else {
                  handleStageStatusChange(index, 'pending');
                }
              }}
            >
              进行中
            </Checkbox>
            <Checkbox
              checked={record.status === 'completed'}
              onChange={(checked) => {
                handleStageStatusChange(
                  index,
                  checked ? 'completed' : 'in_progress'
                );
              }}
            >
              已完成
            </Checkbox>
          </Space>
        );
      },
    },
    {
      title: '完成百分比',
      dataIndex: 'completionPercentage',
      width: 200,
      render: (_: any, record: ProjectStage, index: number) => {
        const isCompleted = record.status === 'completed';
        return (
          <Space>
            <Slider
              value={record.completionPercentage}
              min={0}
              max={100}
              step={1}
              disabled={isCompleted}
              onChange={(value) => {
                const numValue = Array.isArray(value) ? value[0] : value;
                handleCompletionPercentageChange(index, numValue);
              }}
              style={{ width: 120 }}
            />
            <span style={{ minWidth: 40, textAlign: 'right' }}>
              {record.completionPercentage}%
            </span>
          </Space>
        );
      },
    },
    {
      title: '完成附件',
      dataIndex: 'attachmentUrl',
      width: 150,
      render: (_: any, record: ProjectStage, index: number) => {
        return (
          <Upload
            fileList={
              record.attachmentUrl
                ? [
                    {
                      uid: '1',
                      name: '完成附件',
                      url: record.attachmentUrl,
                    },
                  ]
                : []
            }
            onChange={(fileList) => handleAttachmentChange(index, fileList)}
            limit={1}
          >
            <Button size="small">上传</Button>
          </Upload>
        );
      },
    },
  ];

  // 计算整体进度
  const calculateOverallProgress = () => {
    return localStages.reduce((sum, stage) => {
      return sum + (stage.percentage * stage.completionPercentage) / 100;
    }, 0);
  };

  const overallProgress = calculateOverallProgress();

  return (
    <Modal
      title="更新进度"
      visible={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      style={{ width: 800 }}
      getPopupContainer={() => document.body}
      maskStyle={{ zIndex: 3000 }}
      wrapStyle={{ zIndex: 3000 }}
    >
      <Form form={form} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>整体进度：</span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              {overallProgress.toFixed(1)}%
            </span>
          </Space>
        </div>
        <Table
          columns={columns}
          data={localStages}
          pagination={false}
          border={{ wrapper: true, cell: true }}
        />
        <Form.Item noStyle shouldUpdate>
          {() => {
            const formStages = form.getFieldValue('stages') || [];
            return formStages.map((_: any, index: number) => (
              <div key={index} style={{ display: 'none' }}>
                <Form.Item
                  field={`stages.${index}.status`}
                  initialValue={localStages[index]?.status}
                >
                  <input type="hidden" />
                </Form.Item>
                <Form.Item
                  field={`stages.${index}.completionPercentage`}
                  initialValue={localStages[index]?.completionPercentage}
                >
                  <input type="hidden" />
                </Form.Item>
                <Form.Item
                  field={`stages.${index}.attachmentUrl`}
                  initialValue={localStages[index]?.attachmentUrl}
                >
                  <input type="hidden" />
                </Form.Item>
              </div>
            ));
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StageProgressModal;
