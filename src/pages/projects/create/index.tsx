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
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';
import {
  IconFolder,
  IconFile,
  IconCloud,
  IconHome,
  IconPlus,
  IconDelete,
} from '@arco-design/web-react/icon';
import { ProjectType } from '@/types';
import {
  COST_MATRIX,
  EMPLOYEE_LEVELS,
  CITY_TYPES,
  SUPPLIERS,
} from '@/utils/projectConstants';
import styles from './style/index.module.less';

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

const { Title } = Typography;
const { Row, Col } = Grid;

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
    description: '基于计件项目的需求项，按件计费',
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
          // 自动生成项目编号（创建新项目时）
          // 编号格式：PROJ-YYYYMMDD-XXXX
          // YYYYMMDD：年月日（8位），XXXX：序号（4位，从0001开始）
          // 注意：前端使用时间戳确保唯一性，实际生产环境应由后端从数据库查询同一天的最大序号+1
          if (!isEdit && !values.code) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            // 使用时间戳毫秒数的后4位作为序号，确保唯一性
            // 实际生产环境应该从数据库查询同一天的最大序号+1
            const sequence = Date.now().toString().slice(-4).padStart(4, '0');
            values.code = `PROJ-${dateStr}-${sequence}`;
          }

          // 自动生成需求编号（计件制项目）
          // 编号格式：DEM-YYYYMMDD-XXXX
          // YYYYMMDD：年月日（8位），XXXX：序号（4位，从0001开始）
          // 注意：前端使用时间戳确保唯一性，实际生产环境应由后端从数据库查询同一天的最大序号+1
          if (
            projectType === '计件制' &&
            values.demandName &&
            !values.demandCode
          ) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            // 使用时间戳毫秒数的后4位作为序号，确保唯一性
            // 实际生产环境应该从数据库查询同一天的最大序号+1
            const sequence = Date.now().toString().slice(-4).padStart(4, '0');
            values.demandCode = `DEM-${dateStr}-${sequence}`;
          }

          // 调用创建/更新项目API
          const { createProject, updateProject } = await import(
            '@/api/projects'
          );
          if (isEdit && projectId) {
            await updateProject(projectId, values);
            Message.success('项目更新成功');
          } else {
            await createProject(values);
            Message.success('项目创建成功');
          }
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
    <>
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
          <div className={styles['section-wrapper']}>
            <Card>
              <Title heading={6}>主项目信息</Title>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="计件项目"
                    field="frameworkId"
                    rules={[{ required: true, message: '请选择计件项目' }]}
                  >
                    <Select
                      placeholder="请选择计件项目"
                      showSearch
                      allowClear
                      onChange={async (value) => {
                        if (!value) {
                          // 清空计件项目时，清除相关信息
                          formRef.current?.setFieldsValue({
                            frameworkId: undefined,
                            managerId: undefined,
                            managerName: undefined,
                            group: undefined,
                            bizManager: undefined,
                            clientDept: undefined,
                          });
                          return;
                        }
                        // 从计件项目 mock 数据中获取
                        try {
                          const { getFrameworkById } = await import(
                            '../../frameworks/list/mock'
                          );
                          const framework = await getFrameworkById(value);
                          if (framework) {
                            formRef.current?.setFieldsValue({
                              frameworkId: framework.id,
                              managerId: framework.managerId,
                              managerName: framework.managerName,
                              group: framework.group,
                              bizManager: framework.bizManager,
                              clientDept: framework.clientDept,
                            });
                          }
                        } catch (error) {
                          console.error('获取计件项目失败:', error);
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
                                // 跳转到计件项目创建页面
                                history.push('/frameworks/create');
                              }}
                            >
                              创建计件项目
                            </Button>
                          </div>
                        </>
                      )}
                    >
                      {/* 计件项目选项将从 mock 数据动态加载 */}
                      <Select.Option value="fram1">
                        XX电商平台主项目
                      </Select.Option>
                      <Select.Option value="fram2">
                        XX金融系统主项目
                      </Select.Option>
                      <Select.Option value="fram3">
                        XX企业服务平台主项目
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                {/* 计件项目信息展示 - 只有选择了计件项目后才显示 */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, next) =>
                    prev.frameworkId !== next.frameworkId
                  }
                >
                  {() => {
                    const frameworkId =
                      formRef.current?.getFieldValue('frameworkId');
                    if (!frameworkId) {
                      return (
                        <>
                          <Col span={8}></Col>
                          <Col span={8}></Col>
                        </>
                      );
                    }
                    const managerName =
                      formRef.current?.getFieldValue('managerName');
                    const group = formRef.current?.getFieldValue('group');

                    return (
                      <>
                        <Col span={8}>
                          <Form.Item label="项目经理">
                            <span style={{ color: 'var(--color-text-1)' }}>
                              {managerName || '-'}
                            </span>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="归属部门">
                            <span style={{ color: 'var(--color-text-1)' }}>
                              {group || '-'}
                            </span>
                          </Form.Item>
                        </Col>
                      </>
                    );
                  }}
                </Form.Item>
              </Row>
              {/* 第二行：商务经理和客户部 */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, next) =>
                  prev.frameworkId !== next.frameworkId
                }
              >
                {() => {
                  const frameworkId =
                    formRef.current?.getFieldValue('frameworkId');
                  if (!frameworkId) {
                    return null;
                  }
                  const bizManager =
                    formRef.current?.getFieldValue('bizManager');
                  const clientDept =
                    formRef.current?.getFieldValue('clientDept');

                  return (
                    <Row gutter={24} style={{ marginTop: 16 }}>
                      <Col span={8}>
                        <Form.Item label="商务经理">
                          <span style={{ color: 'var(--color-text-1)' }}>
                            {bizManager || '-'}
                          </span>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="客户部">
                          <span style={{ color: 'var(--color-text-1)' }}>
                            {clientDept || '-'}
                          </span>
                        </Form.Item>
                      </Col>
                    </Row>
                  );
                }}
              </Form.Item>
            </Card>
          </div>
        )}

        {/* 计件制项目：需求信息分组 */}
        {projectType === '计件制' && (
          <div className={styles['section-wrapper']}>
            <Card>
              <Title heading={6}>需求信息</Title>
              <Row gutter={24}>
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
          </div>
        )}

        {/* 计件制项目：待补录分组 */}
        {projectType === '计件制' && (
          <div className={styles['section-wrapper']}>
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
          </div>
        )}

        {/* 非计件制项目：基本信息分组 */}
        {projectType !== '计件制' && (
          <div className={styles['section-wrapper']}>
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
          </div>
        )}

        {/* 预算录入分组（仅项目制/计件制，且非待补录） */}
        {(projectType === '项目制' ||
          (projectType === '计件制' && !isPendingEntry)) && (
          <>
            {/* 人力预算 */}
            <div className={styles['section-wrapper']}>
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
                                padding: '4px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                                lineHeight: '1.2',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <div style={{ textAlign: 'left', marginTop: 8 }}>
                          <Button
                            type="dashed"
                            size="small"
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
                        </div>
                      </>
                    );
                  }}
                </Form.List>
              </Card>
            </div>

            {/* 差旅预算 */}
            <div className={styles['section-wrapper']}>
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
                                padding: '4px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                                lineHeight: '1.2',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <div style={{ textAlign: 'left', marginTop: 8 }}>
                          <Button
                            type="dashed"
                            size="small"
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
                        </div>
                      </>
                    );
                  }}
                </Form.List>
              </Card>
            </div>

            {/* 外包预算 */}
            <div className={styles['section-wrapper']}>
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
                                padding: '4px 0',
                                textAlign: 'center',
                                color: 'var(--color-text-3)',
                                fontSize: '12px',
                                lineHeight: '1.2',
                              }}
                            >
                              暂无数据
                            </div>
                          }
                        />
                        <div style={{ textAlign: 'left', marginTop: 8 }}>
                          <Button
                            type="dashed"
                            size="small"
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
                        </div>
                      </>
                    );
                  }}
                </Form.List>
              </Card>
            </div>
          </>
        )}

        {/* 交付计划分组（仅项目制/计件制） */}
        {(projectType === '项目制' || projectType === '计件制') && (
          <div className={styles['section-wrapper']}>
            <Card>
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
                <Col span={8}>
                  <Form.Item
                    label="总占比"
                    noStyle
                    shouldUpdate={(prev, next) => {
                      const prevStages = prev.stages || [];
                      const nextStages = next.stages || [];
                      if (prevStages.length !== nextStages.length) return true;
                      return prevStages.some(
                        (stage: any, index: number) =>
                          stage?.percentage !== nextStages[index]?.percentage
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
                        <div style={{ lineHeight: '32px' }}>
                          <span
                            style={{
                              color:
                                totalPercentage === 100
                                  ? 'var(--color-success-6)'
                                  : 'var(--color-danger-6)',
                              fontWeight: 600,
                            }}
                          >
                            {totalPercentage.toFixed(1)}%
                          </span>
                          {totalPercentage !== 100 && (
                            <span
                              style={{
                                color: 'var(--color-danger-6)',
                                marginLeft: 8,
                                fontSize: '12px',
                              }}
                            >
                              （必须等于100%）
                            </span>
                          )}
                        </div>
                      );
                    }}
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
                      <div style={{ textAlign: 'left', marginTop: 8 }}>
                        <Button
                          type="dashed"
                          size="small"
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
                      </div>
                    </>
                  );
                }}
              </Form.List>
            </Card>
          </div>
        )}

        {/* 财务信息分组 - 放到最后 */}
        {(projectType === '项目制' ||
          (projectType === '计件制' && !isPendingEntry)) && (
          <div className={styles['section-wrapper']}>
            <Card className={styles['finance-card']}>
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

              {/* 实时计算预估利润和预估利润率 */}
              <Form.Item
                shouldUpdate={(prev, next) => {
                  // 监听业绩金额变化
                  if (prev.contractAmount !== next.contractAmount) return true;
                  // 监听人力预算变化
                  const prevLabor = prev.laborBudget || [];
                  const nextLabor = next.laborBudget || [];
                  if (prevLabor.length !== nextLabor.length) return true;
                  if (
                    prevLabor.some(
                      (item: any, idx: number) =>
                        item?.totalCost !== nextLabor[idx]?.totalCost
                    )
                  )
                    return true;
                  // 监听差旅预算变化
                  const prevTravel = prev.travelBudget || [];
                  const nextTravel = next.travelBudget || [];
                  if (prevTravel.length !== nextTravel.length) return true;
                  if (
                    prevTravel.some(
                      (item: any, idx: number) =>
                        item?.totalCost !== nextTravel[idx]?.totalCost
                    )
                  )
                    return true;
                  // 监听外包预算变化
                  const prevOutsource = prev.outsourceBudget || [];
                  const nextOutsource = next.outsourceBudget || [];
                  if (prevOutsource.length !== nextOutsource.length)
                    return true;
                  if (
                    prevOutsource.some(
                      (item: any, idx: number) =>
                        item?.amount !== nextOutsource[idx]?.amount
                    )
                  )
                    return true;
                  return false;
                }}
                noStyle
              >
                {() => {
                  const contractAmount =
                    formRef.current?.getFieldValue('contractAmount') || 0;
                  const laborBudget =
                    formRef.current?.getFieldValue('laborBudget') || [];
                  const travelBudget =
                    formRef.current?.getFieldValue('travelBudget') || [];
                  const outsourceBudget =
                    formRef.current?.getFieldValue('outsourceBudget') || [];

                  // 计算总预算
                  const totalLaborBudget = laborBudget.reduce(
                    (sum: number, item: any) => sum + (item?.totalCost || 0),
                    0
                  );
                  const totalTravelBudget = travelBudget.reduce(
                    (sum: number, item: any) => sum + (item?.totalCost || 0),
                    0
                  );
                  const totalOutsourceBudget = outsourceBudget.reduce(
                    (sum: number, item: any) => sum + (item?.amount || 0),
                    0
                  );
                  const totalBudget =
                    totalLaborBudget + totalTravelBudget + totalOutsourceBudget;

                  // 计算预估利润和利润率
                  const estimatedProfit = contractAmount - totalBudget;
                  const estimatedProfitRate =
                    contractAmount > 0
                      ? (estimatedProfit / contractAmount) * 100
                      : 0;

                  return (
                    <div className={styles['profit-card']}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <div className={styles['profit-item']}>
                            <div className={styles['profit-label']}>总预算</div>
                            <div className={styles['profit-value-secondary']}>
                              {totalBudget.toFixed(2)} 元
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className={styles['profit-item']}>
                            <div className={styles['profit-label']}>
                              预估利润
                            </div>
                            <div
                              className={styles['profit-value-secondary']}
                              style={{
                                color:
                                  estimatedProfit >= 0
                                    ? 'var(--color-success-6)'
                                    : 'var(--color-danger-6)',
                              }}
                            >
                              {estimatedProfit >= 0 ? '+' : ''}
                              {estimatedProfit.toFixed(2)} 元
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className={styles['profit-item']}>
                            <div className={styles['profit-label']}>
                              预估利润率
                            </div>
                            <div
                              className={styles['profit-value-secondary']}
                              style={{
                                color:
                                  estimatedProfitRate >= 0
                                    ? 'var(--color-success-6)'
                                    : 'var(--color-danger-6)',
                              }}
                            >
                              {estimatedProfitRate >= 0 ? '+' : ''}
                              {estimatedProfitRate.toFixed(2)}%
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );
                }}
              </Form.Item>
            </Card>
          </div>
        )}
      </Form>
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
        getPopupContainer={() => document.body}
        maskStyle={{ zIndex: 3000 }}
        wrapStyle={{ zIndex: 3000 }}
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
    </>
  );
}

export default ProjectCreate;
