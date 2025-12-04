/**
 * 商业项目创建/编辑页面
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Typography,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Grid,
  Message,
  Divider,
  Checkbox,
  Modal,
  Table,
  Dropdown,
  Menu,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';
import {
  IconArrowLeft,
  IconFolder,
  IconFile,
  IconCloud,
  IconHome,
  IconPlus,
  IconDelete,
  IconMore,
} from '@arco-design/web-react/icon';
import { ProjectType } from '@/types';
import styles from './style/index.module.less';

// 人力成本矩阵（从配置中获取）
const COST_MATRIX: Record<string, Record<string, number>> = {
  P5: { Chengdu: 1000, Hangzhou: 1400 },
  P6: { Chengdu: 1500, Hangzhou: 2000 },
  P7: { Chengdu: 2200, Hangzhou: 2800 },
  P8: { Chengdu: 3000, Hangzhou: 3800 },
  M1: { Chengdu: 2500, Hangzhou: 3200 },
  M2: { Chengdu: 3500, Hangzhou: 4500 },
};

// 员工级别选项
const EMPLOYEE_LEVELS = ['P5', 'P6', 'P7', 'P8', 'M1', 'M2'];

// 城市类型选项
const CITY_TYPES = [
  { label: '成都', value: 'Chengdu' },
  { label: '杭州', value: 'Hangzhou' },
];

// Mock 阶段模板数据
const STAGE_TEMPLATES = [
  {
    id: 'template1',
    name: '标准项目模板',
    type: 'project' as const,
    stages: [
      { id: 's1', name: '需求分析', percentage: 20 },
      { id: 's2', name: '设计阶段', percentage: 30 },
      { id: 's3', name: '开发阶段', percentage: 40 },
      { id: 's4', name: '测试验收', percentage: 10 },
    ],
  },
  {
    id: 'template2',
    name: '计件制模板',
    type: 'piecework' as const,
    stages: [
      { id: 's1', name: '需求沟通', percentage: 20 },
      { id: 's2', name: '原型设计', percentage: 40 },
      { id: 's3', name: 'UI设计', percentage: 30 },
      { id: 's4', name: '交付验收', percentage: 10 },
    ],
  },
];

// Mock 供应商数据
const SUPPLIERS = [
  { id: 'supplier1', name: '供应商A' },
  { id: 'supplier2', name: '供应商B' },
  { id: 'supplier3', name: '供应商C' },
];

const { Title } = Typography;
const { Row, Col } = Grid;
const { useForm } = Form;

// 项目类型配置
const projectTypes: Array<{
  type: ProjectType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: '项目制',
    title: '项目制',
    description: '独立项目，有明确的业绩金额和交付周期',
    icon: <IconFolder />,
    color: '#165DFF', // blue
  },
  {
    type: '计件制',
    title: '计件制',
    description: '基于框架协议的需求项，按件计费',
    icon: <IconFile />,
    color: '#00B42A', // green
  },
  {
    type: '离岸制',
    title: '离岸制',
    description: '按人月结算，远程交付，按月录入业绩',
    icon: <IconCloud />,
    color: '#FF7D00', // orange
  },
  {
    type: '驻场制',
    title: '驻场制',
    description: '驻点客户现场，按月结算，按月录入业绩',
    icon: <IconHome />,
    color: '#722ED1', // purple
  },
];

function ProjectCreate() {
  const history = useHistory();
  const formRef = useRef<FormInstance>();
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [isPendingEntry, setIsPendingEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const params = qs.parseUrl(window.location.href).query;
  const projectId = params.id as string;
  const typeParam = params.type as ProjectType;
  const isEdit = !!projectId;

  // 如果是编辑模式或URL中有类型参数，直接设置类型
  useEffect(() => {
    if (isEdit || typeParam) {
      if (typeParam) {
        setProjectType(typeParam);
        formRef.current?.setFieldsValue({ type: typeParam });
      }
    } else {
      // 创建模式，打开类型选择弹窗
      setTypeModalVisible(true);
    }
  }, [isEdit, typeParam]);

  // 监听项目类型变化
  const formType = Form.useWatch('type', formRef.current);
  const formPendingEntry = Form.useWatch('isPendingEntry', formRef.current);

  useEffect(() => {
    if (formType && formType !== projectType) {
      setProjectType(formType);
    }
  }, [formType, projectType]);

  useEffect(() => {
    if (formPendingEntry !== undefined && formPendingEntry !== isPendingEntry) {
      setIsPendingEntry(formPendingEntry);
    }
  }, [formPendingEntry, isPendingEntry]);

  // 当项目类型确定后，初始化人力预算为一行（项目制/计件制非待补录）
  useEffect(() => {
    if (
      formRef.current &&
      (projectType === '项目制' ||
        (projectType === '计件制' && !isPendingEntry))
    ) {
      const currentBudget = formRef.current.getFieldValue('laborBudget');
      if (!currentBudget || currentBudget.length === 0) {
        formRef.current.setFieldValue('laborBudget', [
          {
            employeeLevel: '',
            cityType: '',
            days: undefined,
            unitCost: 0,
            totalCost: 0,
          },
        ]);
      }
    }
  }, [projectType, isPendingEntry]);

  // 选择项目类型
  function handleSelectType(type: ProjectType) {
    setProjectType(type);
    setTypeModalVisible(false);
    // 设置表单默认值
    formRef.current?.setFieldsValue({ type });
  }

  // 取消选择类型
  function handleCancelTypeSelection() {
    setTypeModalVisible(false);
    history.goBack();
  }

  // 提交
  function handleSubmit() {
    formRef.current?.validate().then(
      async (values) => {
        // 根据业务规则进行额外验证
        const errors: string[] = [];

        // 项目制/计件制（非待补录）：人力预算必填，至少一条记录，且每条记录必须完整
        if (
          projectType === '项目制' ||
          (projectType === '计件制' && !values.isPendingEntry)
        ) {
          if (!values.laborBudget || values.laborBudget.length === 0) {
            errors.push('人力预算至少需要一条记录');
          } else {
            // 验证每条记录是否完整
            const incompleteRecords = values.laborBudget.filter(
              (item: any) =>
                !item.employeeLevel ||
                !item.cityType ||
                !item.days ||
                item.days <= 0
            );
            if (incompleteRecords.length > 0) {
              errors.push(
                '人力预算中员工级别、城市类型、人日数均为必填项，且人日数必须大于0'
              );
            }
          }
        }

        // 阶段占比验证：所有阶段占比之和必须等于100%
        if (
          (projectType === '项目制' || projectType === '计件制') &&
          values.stages &&
          values.stages.length > 0
        ) {
          const totalPercentage = values.stages.reduce(
            (sum: number, stage: any) => sum + (stage?.percentage || 0),
            0
          );
          if (Math.abs(totalPercentage - 100) > 0.01) {
            errors.push(
              `交付计划总占比为 ${totalPercentage.toFixed(1)}%，必须等于100%`
            );
          }
        }

        if (errors.length > 0) {
          Message.error(errors.join('；'));
          return;
        }

        setLoading(true);
        try {
          // TODO: 调用创建/更新项目API
          console.log('提交数据:', values);
          Message.success(isEdit ? '项目更新成功' : '项目创建成功');
          setTimeout(() => {
            history.push('/projects/list');
          }, 1000);
        } catch (error) {
          Message.error('提交失败，请重试');
        } finally {
          setLoading(false);
        }
      },
      (errors) => {
        console.error('表单验证失败:', errors);
        Message.error('请检查表单填写是否正确');
      }
    );
  }

  // 取消
  function handleCancel() {
    history.goBack();
  }

  // 表单页面
  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={6}>
            {isEdit
              ? `编辑${projectType || ''}项目`
              : projectType
              ? `新建${projectType}项目`
              : '创建项目'}
          </Title>
        </div>

        <Form
          ref={formRef}
          layout="horizontal"
          labelAlign="left"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          className={styles['form-group']}
          initialValues={{
            type: projectType || '',
            status: '待启动',
            isPendingEntry: false,
            laborBudget:
              projectType === '项目制' ||
              (projectType === '计件制' && !isPendingEntry)
                ? [
                    {
                      employeeLevel: '',
                      cityType: '',
                      days: undefined,
                      unitCost: 0,
                      totalCost: 0,
                    },
                  ]
                : [],
            travelBudget: [],
            outsourceBudget: [],
            stages: [],
          }}
        >
          {/* 计件制项目：主项目信息分组 */}
          {projectType === '计件制' && (
            <Card>
              <Title heading={6}>主项目信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="框架协议"
                    field="frameworkId"
                    rules={[{ required: true, message: '请选择框架协议' }]}
                  >
                    <Select
                      placeholder="请选择框架协议"
                      showSearch
                      allowClear
                      onChange={(value) => {
                        // 模拟框架协议数据
                        const frameworks: Record<string, any> = {
                          fram1: {
                            managerId: 'user1',
                            managerName: '张三',
                            group: '设计一部',
                            bizManager: '李商务',
                            clientDept: '电商客户部',
                          },
                          fram2: {
                            managerId: 'user2',
                            managerName: '李四',
                            group: '设计二部',
                            bizManager: '王商务',
                            clientDept: '金融客户部',
                          },
                        };
                        const framework = frameworks[value];
                        if (framework) {
                          formRef.current?.setFieldsValue({
                            managerId: framework.managerId,
                            managerName: framework.managerName,
                            group: framework.group,
                            bizManager: framework.bizManager,
                            clientDept: framework.clientDept,
                          });
                        }
                      }}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '4px 0' }} />
                          <div style={{ padding: '4px 8px' }}>
                            <Button
                              type="text"
                              long
                              icon={<IconPlus />}
                              onClick={() => {
                                Message.info('创建框架协议功能待实现');
                                // TODO: 打开创建框架协议的弹窗或页面
                              }}
                            >
                              创建框架协议
                            </Button>
                          </div>
                        </>
                      )}
                    >
                      <Select.Option value="fram1">
                        XX电商平台主项目
                      </Select.Option>
                      <Select.Option value="fram2">XX银行主项目</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="项目经理" field="managerName">
                    <Input placeholder="选择框架协议后自动带出" disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="归属部门" field="group">
                    <Input placeholder="选择框架协议后自动带出" disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="商务经理" field="bizManager">
                    <Input placeholder="选择框架协议后自动带出" disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="客户部" field="clientDept">
                    <Input placeholder="选择框架协议后自动带出" disabled />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* 计件制项目：需求信息分组 */}
          {projectType === '计件制' && (
            <Card>
              <Title heading={6}>需求信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="需求编号"
                    field="demandCode"
                    rules={[{ required: true, message: '请输入需求编号' }]}
                  >
                    <Input placeholder="请输入需求编号" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="需求名称"
                    field="demandName"
                    rules={[{ required: true, message: '请输入需求名称' }]}
                  >
                    <Input placeholder="请输入需求名称" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="计划开始日期"
                    field="planStartDate"
                    rules={[{ required: true, message: '请选择计划开始日期' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="请选择计划开始日期"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="计划结束日期"
                    field="planEndDate"
                    rules={[{ required: true, message: '请选择计划结束日期' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder="请选择计划结束日期"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* 计件制项目：待补录分组 */}
          {projectType === '计件制' && (
            <Card>
              <Title heading={6}>其他信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label=""
                    field="isPendingEntry"
                    triggerPropName="checked"
                    initialValue={false}
                  >
                    <Checkbox
                      onChange={(checked) => setIsPendingEntry(checked)}
                    >
                      待补录
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* 非计件制项目：基本信息分组 */}
          {projectType !== '计件制' && (
            <Card>
              <Title heading={6}>基本信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="项目名称"
                    field="name"
                    rules={[{ required: true, message: '请输入项目名称' }]}
                  >
                    <Input placeholder="请输入项目名称" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="项目经理"
                    field="managerId"
                    rules={[{ required: true, message: '请选择项目经理' }]}
                  >
                    <Select placeholder="请选择项目经理">
                      <Select.Option value="user1">张三</Select.Option>
                      <Select.Option value="user2">李四</Select.Option>
                      <Select.Option value="user3">王五</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="归属部门"
                    field="group"
                    rules={[{ required: true, message: '请选择归属部门' }]}
                  >
                    <Select placeholder="请选择归属部门">
                      <Select.Option value="设计一部">设计一部</Select.Option>
                      <Select.Option value="设计二部">设计二部</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="商务经理"
                    field="bizManager"
                    rules={[{ required: true, message: '请输入商务经理' }]}
                  >
                    <Input placeholder="请输入商务经理" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="客户部"
                    field="clientDept"
                    rules={[{ required: true, message: '请选择客户部' }]}
                  >
                    <Select placeholder="请选择客户部">
                      <Select.Option value="金融客户部">
                        金融客户部
                      </Select.Option>
                      <Select.Option value="电商客户部">
                        电商客户部
                      </Select.Option>
                      <Select.Option value="企业客户部">
                        企业客户部
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                {/* 项目制：计划日期必填 */}
                {projectType === '项目制' && (
                  <>
                    <Col span={8}>
                      <Form.Item
                        label="计划开始日期"
                        field="planStartDate"
                        rules={[
                          { required: true, message: '请选择计划开始日期' },
                        ]}
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="请选择计划开始日期"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="计划结束日期"
                        field="planEndDate"
                        rules={[
                          { required: true, message: '请选择计划结束日期' },
                        ]}
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="请选择计划结束日期"
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
                {/* 离岸制/驻场制：计划日期非必填 */}
                {(projectType === '离岸制' || projectType === '驻场制') && (
                  <>
                    <Col span={8}>
                      <Form.Item label="计划开始日期" field="planStartDate">
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="请选择计划开始日期（可选）"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="计划结束日期" field="planEndDate">
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="请选择计划结束日期（可选）"
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          )}

          {/* 业绩金额分组 */}
          {(projectType === '项目制' ||
            (projectType === '计件制' && !isPendingEntry)) && (
            <Card>
              <Title heading={6}>财务信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="业绩金额"
                    field="contractAmount"
                    rules={[
                      { required: true, message: '请输入业绩金额' },
                      {
                        type: 'number',
                        min: 0.01,
                        message: '业绩金额必须大于0',
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入业绩金额"
                      precision={2}
                      min={0}
                      suffix="元"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* 预算录入分组（仅项目制/计件制，且非待补录） */}
          {(projectType === '项目制' ||
            (projectType === '计件制' && !isPendingEntry)) && (
            <>
              {/* 人力预算 */}
              <Card>
                <Title heading={6}>
                  人力预算{' '}
                  <span
                    style={{
                      color: 'var(--color-text-3)',
                      fontSize: '12px',
                      fontWeight: 'normal',
                    }}
                  >
                    （必填，至少一条记录）
                  </span>
                </Title>
                <Form.List field="laborBudget" initialValue={[]}>
                  {(fields, { add, remove }) => {
                    // 确保 fields 是数组
                    if (!Array.isArray(fields)) {
                      return null;
                    }

                    const columns = [
                      {
                        title: (
                          <span>
                            员工级别{' '}
                            <span style={{ color: '#F53F3F', marginLeft: 2 }}>
                              *
                            </span>
                          </span>
                        ),
                        dataIndex: 'employeeLevel',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`laborBudget.${index}.employeeLevel`}
                            rules={[
                              { required: true, message: '请选择员工级别' },
                            ]}
                            noStyle
                          >
                            <Select
                              placeholder="请选择员工级别"
                              style={{ width: '100%' }}
                              onChange={() => {
                                const employeeLevel =
                                  formRef.current?.getFieldValue(
                                    `laborBudget.${index}.employeeLevel`
                                  );
                                const cityType = formRef.current?.getFieldValue(
                                  `laborBudget.${index}.cityType`
                                );
                                const days = formRef.current?.getFieldValue(
                                  `laborBudget.${index}.days`
                                );
                                if (employeeLevel && cityType && days) {
                                  const unitCost =
                                    COST_MATRIX[employeeLevel]?.[cityType] || 0;
                                  const totalCost = days * unitCost;
                                  setTimeout(() => {
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.unitCost`,
                                      unitCost
                                    );
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.totalCost`,
                                      totalCost
                                    );
                                  }, 0);
                                }
                              }}
                            >
                              {EMPLOYEE_LEVELS.map((level) => (
                                <Select.Option key={level} value={level}>
                                  {level}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        ),
                      },
                      {
                        title: (
                          <span>
                            城市类型{' '}
                            <span style={{ color: '#F53F3F', marginLeft: 2 }}>
                              *
                            </span>
                          </span>
                        ),
                        dataIndex: 'cityType',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`laborBudget.${index}.cityType`}
                            rules={[
                              { required: true, message: '请选择城市类型' },
                            ]}
                            noStyle
                          >
                            <Select
                              placeholder="请选择城市类型"
                              style={{ width: '100%' }}
                              onChange={() => {
                                const employeeLevel =
                                  formRef.current?.getFieldValue(
                                    `laborBudget.${index}.employeeLevel`
                                  );
                                const cityType = formRef.current?.getFieldValue(
                                  `laborBudget.${index}.cityType`
                                );
                                const days = formRef.current?.getFieldValue(
                                  `laborBudget.${index}.days`
                                );
                                if (employeeLevel && cityType && days) {
                                  const unitCost =
                                    COST_MATRIX[employeeLevel]?.[cityType] || 0;
                                  const totalCost = days * unitCost;
                                  setTimeout(() => {
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.unitCost`,
                                      unitCost
                                    );
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.totalCost`,
                                      totalCost
                                    );
                                  }, 0);
                                }
                              }}
                            >
                              {CITY_TYPES.map((city) => (
                                <Select.Option
                                  key={city.value}
                                  value={city.value}
                                >
                                  {city.label}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        ),
                      },
                      {
                        title: (
                          <span>
                            人日数{' '}
                            <span style={{ color: '#F53F3F', marginLeft: 2 }}>
                              *
                            </span>
                          </span>
                        ),
                        dataIndex: 'days',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`laborBudget.${index}.days`}
                            rules={[
                              { required: true, message: '请输入人日数' },
                              {
                                type: 'number',
                                min: 0.01,
                                message: '人日数必须大于0',
                              },
                            ]}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入人日数"
                              precision={2}
                              min={0}
                              style={{ width: '100%' }}
                              onChange={(value) => {
                                const employeeLevel =
                                  formRef.current?.getFieldValue(
                                    `laborBudget.${index}.employeeLevel`
                                  );
                                const cityType = formRef.current?.getFieldValue(
                                  `laborBudget.${index}.cityType`
                                );
                                if (employeeLevel && cityType && value) {
                                  const unitCost =
                                    COST_MATRIX[employeeLevel]?.[cityType] || 0;
                                  const totalCost = value * unitCost;
                                  setTimeout(() => {
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.unitCost`,
                                      unitCost
                                    );
                                    formRef.current?.setFieldValue(
                                      `laborBudget.${index}.totalCost`,
                                      totalCost
                                    );
                                  }, 0);
                                }
                              }}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '单价（元/人日）',
                        dataIndex: 'unitCost',
                        width: 140,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`laborBudget.${index}.unitCost`}
                            noStyle
                            shouldUpdate={(prev, next) => {
                              const prevValue =
                                prev.laborBudget?.[index]?.unitCost;
                              const nextValue =
                                next.laborBudget?.[index]?.unitCost;
                              return prevValue !== nextValue;
                            }}
                          >
                            {() => {
                              const unitCost = formRef.current?.getFieldValue(
                                `laborBudget.${index}.unitCost`
                              );
                              return (
                                <span style={{ color: 'var(--color-text-2)' }}>
                                  {unitCost ? `${unitCost.toFixed(2)} 元` : '-'}
                                </span>
                              );
                            }}
                          </Form.Item>
                        ),
                      },
                      {
                        title: '总价（元）',
                        dataIndex: 'totalCost',
                        width: 140,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`laborBudget.${index}.totalCost`}
                            noStyle
                            shouldUpdate={(prev, next) => {
                              const prevValue =
                                prev.laborBudget?.[index]?.totalCost;
                              const nextValue =
                                next.laborBudget?.[index]?.totalCost;
                              return prevValue !== nextValue;
                            }}
                          >
                            {() => {
                              const totalCost = formRef.current?.getFieldValue(
                                `laborBudget.${index}.totalCost`
                              );
                              return (
                                <span
                                  style={{
                                    color: 'var(--color-text-1)',
                                    fontWeight: 500,
                                  }}
                                >
                                  {totalCost
                                    ? `${totalCost.toFixed(2)} 元`
                                    : '-'}
                                </span>
                              );
                            }}
                          </Form.Item>
                        ),
                      },
                      {
                        title: '操作',
                        width: 80,
                        render: (_, record, index) => (
                          <Button
                            type="text"
                            status="danger"
                            icon={<IconDelete />}
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ];

                    return (
                      <>
                        <Table
                          columns={columns}
                          data={fields}
                          pagination={false}
                          border={{ wrapper: true, cell: true }}
                          style={{ marginBottom: 16 }}
                          noDataElement={
                            <div
                              style={{
                                padding: '8px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <Button
                          type="dashed"
                          long
                          icon={<IconPlus />}
                          onClick={() => {
                            add({
                              employeeLevel: '',
                              cityType: '',
                              days: undefined,
                              unitCost: 0,
                              totalCost: 0,
                            });
                          }}
                        >
                          添加人力预算
                        </Button>
                      </>
                    );
                  }}
                </Form.List>
              </Card>

              {/* 差旅预算 */}
              <Card>
                <Title heading={6}>差旅预算</Title>
                <Form.List field="travelBudget" initialValue={[]}>
                  {(fields, { add, remove }) => {
                    if (!Array.isArray(fields)) {
                      return null;
                    }

                    const updateTotalCost = (index: number) => {
                      const transportBig =
                        formRef.current?.getFieldValue(
                          `travelBudget.${index}.transportBig`
                        ) || 0;
                      const stay =
                        formRef.current?.getFieldValue(
                          `travelBudget.${index}.stay`
                        ) || 0;
                      const transportSmall =
                        formRef.current?.getFieldValue(
                          `travelBudget.${index}.transportSmall`
                        ) || 0;
                      const allowance =
                        formRef.current?.getFieldValue(
                          `travelBudget.${index}.allowance`
                        ) || 0;
                      const other =
                        formRef.current?.getFieldValue(
                          `travelBudget.${index}.other`
                        ) || 0;
                      const totalCost =
                        transportBig +
                        stay +
                        transportSmall +
                        allowance +
                        other;
                      setTimeout(() => {
                        formRef.current?.setFieldValue(
                          `travelBudget.${index}.totalCost`,
                          totalCost
                        );
                      }, 0);
                    };

                    const columns = [
                      {
                        title: '差旅事项',
                        dataIndex: 'item',
                        width: 150,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.item`}
                            rules={[
                              { required: true, message: '请输入差旅事项' },
                              {
                                validator: (value, callback) => {
                                  const transportBig =
                                    formRef.current?.getFieldValue(
                                      `travelBudget.${index}.transportBig`
                                    ) || 0;
                                  const stay =
                                    formRef.current?.getFieldValue(
                                      `travelBudget.${index}.stay`
                                    ) || 0;
                                  const transportSmall =
                                    formRef.current?.getFieldValue(
                                      `travelBudget.${index}.transportSmall`
                                    ) || 0;
                                  const allowance =
                                    formRef.current?.getFieldValue(
                                      `travelBudget.${index}.allowance`
                                    ) || 0;
                                  const other =
                                    formRef.current?.getFieldValue(
                                      `travelBudget.${index}.other`
                                    ) || 0;
                                  const total =
                                    transportBig +
                                    stay +
                                    transportSmall +
                                    allowance +
                                    other;
                                  if (value && total === 0) {
                                    callback('至少一项费用必须大于0');
                                  } else {
                                    callback();
                                  }
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              placeholder="请输入差旅事项"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '大交通（元）',
                        dataIndex: 'transportBig',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.transportBig`}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                              onChange={() => updateTotalCost(index)}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '住宿（元）',
                        dataIndex: 'stay',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.stay`}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                              onChange={() => updateTotalCost(index)}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '小交通（元）',
                        dataIndex: 'transportSmall',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.transportSmall`}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                              onChange={() => updateTotalCost(index)}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '补助（元）',
                        dataIndex: 'allowance',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.allowance`}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                              onChange={() => updateTotalCost(index)}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '其他（元）',
                        dataIndex: 'other',
                        width: 120,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.other`}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                              onChange={() => updateTotalCost(index)}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '总价（元）',
                        dataIndex: 'totalCost',
                        width: 140,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.totalCost`}
                            noStyle
                            shouldUpdate={(prev, next) => {
                              const prevValue =
                                prev.travelBudget?.[index]?.totalCost;
                              const nextValue =
                                next.travelBudget?.[index]?.totalCost;
                              return prevValue !== nextValue;
                            }}
                          >
                            {() => {
                              const totalCost = formRef.current?.getFieldValue(
                                `travelBudget.${index}.totalCost`
                              );
                              return (
                                <span
                                  style={{
                                    color: 'var(--color-text-1)',
                                    fontWeight: 500,
                                  }}
                                >
                                  {totalCost
                                    ? `${totalCost.toFixed(2)} 元`
                                    : '-'}
                                </span>
                              );
                            }}
                          </Form.Item>
                        ),
                      },
                      {
                        title: '操作',
                        width: 80,
                        render: (_, record, index) => (
                          <Button
                            type="text"
                            status="danger"
                            icon={<IconDelete />}
                            onClick={() => remove(index)}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ];

                    return (
                      <>
                        <Table
                          columns={columns}
                          data={fields}
                          pagination={false}
                          border={{ wrapper: true, cell: true }}
                          style={{ marginBottom: 16 }}
                          noDataElement={
                            <div
                              style={{
                                padding: '8px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <Button
                          type="dashed"
                          long
                          icon={<IconPlus />}
                          onClick={() => {
                            add({
                              item: '',
                              transportBig: undefined,
                              stay: undefined,
                              transportSmall: undefined,
                              allowance: undefined,
                              other: undefined,
                              totalCost: 0,
                            });
                          }}
                        >
                          添加差旅预算
                        </Button>
                      </>
                    );
                  }}
                </Form.List>
              </Card>

              {/* 外包预算 */}
              <Card>
                <Title heading={6}>外包预算</Title>
                <Form.List field="outsourceBudget" initialValue={[]}>
                  {(fields, { add, remove }) => {
                    if (!Array.isArray(fields)) {
                      return null;
                    }

                    const columns = [
                      {
                        title: '外包事项',
                        dataIndex: 'item',
                        width: 200,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`outsourceBudget.${index}.item`}
                            rules={[
                              { required: true, message: '请输入外包事项' },
                            ]}
                            noStyle
                          >
                            <Input
                              placeholder="请输入外包事项"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '供应商',
                        dataIndex: 'supplierName',
                        width: 200,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`outsourceBudget.${index}.supplierName`}
                            noStyle
                          >
                            <Select
                              placeholder="请选择供应商（可选）"
                              allowClear
                              showSearch
                              style={{ width: '100%' }}
                            >
                              {SUPPLIERS.map((supplier) => (
                                <Select.Option
                                  key={supplier.id}
                                  value={supplier.name}
                                >
                                  {supplier.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        ),
                      },
                      {
                        title: '金额（元）',
                        dataIndex: 'amount',
                        width: 150,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`outsourceBudget.${index}.amount`}
                            rules={[
                              { required: true, message: '请输入金额' },
                              {
                                type: 'number',
                                min: 0.01,
                                message: '金额必须大于0',
                              },
                            ]}
                            noStyle
                          >
                            <InputNumber
                              placeholder="请输入金额"
                              precision={2}
                              min={0}
                              suffix="元"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '操作',
                        width: 80,
                        render: (_, record, index) => (
                          <Button
                            type="text"
                            status="danger"
                            icon={<IconDelete />}
                            onClick={() => remove(index)}
                          >
                            删除
                          </Button>
                        ),
                      },
                    ];

                    return (
                      <>
                        <Table
                          columns={columns}
                          data={fields}
                          pagination={false}
                          border={{ wrapper: true, cell: true }}
                          style={{ marginBottom: 16 }}
                          noDataElement={
                            <div
                              style={{
                                padding: '8px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <Button
                          type="dashed"
                          long
                          icon={<IconPlus />}
                          onClick={() => {
                            add({
                              item: '',
                              supplierName: '',
                              amount: undefined,
                            });
                          }}
                        >
                          添加外包预算
                        </Button>
                      </>
                    );
                  }}
                </Form.List>
              </Card>
            </>
          )}

          {/* 交付计划分组（仅项目制/计件制） */}
          {(projectType === '项目制' || projectType === '计件制') && (
            <Card style={{ marginBottom: 40 }}>
              <Title heading={6}>交付计划</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="阶段模板"
                    field="stageTemplateId"
                    rules={[{ required: true, message: '请选择阶段模板' }]}
                  >
                    <Select
                      placeholder="请选择阶段模板"
                      onChange={(value) => {
                        const template = STAGE_TEMPLATES.find(
                          (t) => t.id === value
                        );
                        if (template) {
                          // 自动填充阶段列表
                          formRef.current?.setFieldsValue({
                            stages: template.stages.map((stage) => ({
                              name: stage.name,
                              percentage: stage.percentage,
                            })),
                          });
                        }
                      }}
                    >
                      {STAGE_TEMPLATES.filter(
                        (t) =>
                          t.type ===
                          (projectType === '项目制' ? 'project' : 'piecework')
                      ).map((template) => (
                        <Select.Option key={template.id} value={template.id}>
                          {template.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.List field="stages" initialValue={[]}>
                {(fields, { add, remove }) => {
                  if (!Array.isArray(fields)) {
                    return null;
                  }

                  const columns = [
                    {
                      title: (
                        <span>
                          阶段名称{' '}
                          <span style={{ color: '#F53F3F', marginLeft: 2 }}>
                            *
                          </span>
                        </span>
                      ),
                      dataIndex: 'name',
                      width: 200,
                      render: (_, record, index) => (
                        <Form.Item
                          field={`stages.${index}.name`}
                          rules={[
                            { required: true, message: '请输入阶段名称' },
                          ]}
                          noStyle
                        >
                          <Input
                            placeholder="请输入阶段名称"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ),
                    },
                    {
                      title: (
                        <span>
                          占比（%）{' '}
                          <span style={{ color: '#F53F3F', marginLeft: 2 }}>
                            *
                          </span>
                        </span>
                      ),
                      dataIndex: 'percentage',
                      width: 150,
                      render: (_, record, index) => (
                        <Form.Item
                          field={`stages.${index}.percentage`}
                          rules={[
                            { required: true, message: '请输入占比' },
                            {
                              type: 'number',
                              min: 0,
                              max: 100,
                              message: '占比必须在0-100之间',
                            },
                          ]}
                          noStyle
                        >
                          <InputNumber
                            placeholder="请输入占比"
                            precision={1}
                            min={0}
                            max={100}
                            suffix="%"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '操作',
                      width: 80,
                      render: (_, record, index) => (
                        <Button
                          type="text"
                          status="danger"
                          icon={<IconDelete />}
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          title={
                            fields.length === 1 ? '至少保留一个阶段' : '删除'
                          }
                        >
                          删除
                        </Button>
                      ),
                    },
                  ];

                  return (
                    <>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, next) => {
                          const prevStages = prev.stages || [];
                          const nextStages = next.stages || [];
                          if (prevStages.length !== nextStages.length)
                            return true;
                          return prevStages.some(
                            (stage: any, index: number) =>
                              stage?.percentage !==
                              nextStages[index]?.percentage
                          );
                        }}
                      >
                        {() => {
                          const stages =
                            formRef.current?.getFieldValue('stages') || [];
                          const totalPercentage = stages.reduce(
                            (sum: number, stage: any) =>
                              sum + (stage?.percentage || 0),
                            0
                          );
                          return (
                            <div
                              style={{
                                marginBottom: 16,
                                padding: 12,
                                backgroundColor: 'var(--color-bg-2)',
                                borderRadius: 4,
                              }}
                            >
                              <Space>
                                <span
                                  style={{
                                    color:
                                      totalPercentage === 100
                                        ? 'var(--color-text-1)'
                                        : 'var(--color-danger-6)',
                                  }}
                                >
                                  总占比：
                                </span>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color:
                                      totalPercentage === 100
                                        ? 'var(--color-success-6)'
                                        : 'var(--color-danger-6)',
                                  }}
                                >
                                  {totalPercentage.toFixed(1)}%
                                </span>
                                {totalPercentage !== 100 && (
                                  <span
                                    style={{ color: 'var(--color-danger-6)' }}
                                  >
                                    （必须等于100%）
                                  </span>
                                )}
                              </Space>
                            </div>
                          );
                        }}
                      </Form.Item>
                      <Table
                        columns={columns}
                        data={fields}
                        pagination={false}
                        border={{ wrapper: true, cell: true }}
                        style={{ marginBottom: 16 }}
                        noDataElement={
                          <div
                            style={{
                              padding: '8px 0',
                              textAlign: 'center',
                              color: 'var(--color-text-3)',
                              fontSize: '12px',
                            }}
                          >
                            暂无数据
                          </div>
                        }
                      />
                      <Button
                        type="dashed"
                        long
                        icon={<IconPlus />}
                        onClick={() => {
                          add({
                            name: '',
                            percentage: undefined,
                          });
                        }}
                      >
                        添加阶段
                      </Button>
                    </>
                  );
                }}
              </Form.List>
            </Card>
          )}
        </Form>
      </Card>
      {/* 操作按钮 */}
      <div className={styles.actions}>
        <Space>
          <Button onClick={handleCancel} size="large">
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            size="large"
          >
            {isEdit ? '更新' : '提交审批'}
          </Button>
        </Space>
      </div>

      {/* 项目类型选择弹窗 */}
      <Modal
        title="选择项目类型"
        visible={typeModalVisible}
        onCancel={handleCancelTypeSelection}
        footer={null}
        style={{ width: 800 }}
        maskClosable={false}
      >
        <Row gutter={24} className={styles['type-cards']}>
          {projectTypes.map((item) => (
            <Col xs={24} sm={12} key={item.type}>
              <Card
                className={styles['type-card']}
                hoverable
                onClick={() => handleSelectType(item.type)}
              >
                <div className={styles['type-card-content']}>
                  <div
                    className={styles['type-card-icon']}
                    style={{ color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className={styles['type-card-text']}>
                    <div className={styles['type-card-title']}>
                      {item.title}
                    </div>
                    <div className={styles['type-card-desc']}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  );
}

export default ProjectCreate;
