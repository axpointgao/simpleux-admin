/**
 * 商业项目变更页面
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
  Upload,
  Table,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import { Project, ProjectType } from '@/types';
import {
  COST_MATRIX,
  EMPLOYEE_LEVELS,
  CITY_TYPES,
  SUPPLIERS,
} from '@/utils/projectConstants';
import { getProjectById, getProjectBudgets } from '../list/mock';
import styles from './style/index.module.less';

const { Title } = Typography;
const { Row, Col } = Grid;

function ProjectChange() {
  const history = useHistory();
  const formRef = useRef<FormInstance>();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [projectType, setProjectType] = useState<ProjectType | ''>('');

  const params = qs.parseUrl(window.location.href).query;
  const projectId = params.id as string;

  // 加载项目信息
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    } else {
      Message.error('缺少项目ID参数');
      history.push('/projects/list');
    }
  }, [projectId]);

  async function loadProjectData() {
    try {
      setLoading(true);
      const projectData = await getProjectById(projectId);
      setProject(projectData);
      setProjectType(projectData.type);

      // 加载预算数据
      const budgets = await getProjectBudgets(projectId);

      // 初始化表单
      formRef.current?.setFieldsValue({
        // 基本信息
        name: projectData.name,
        managerName: projectData.managerName,
        group: projectData.group,
        bizManager: projectData.bizManager,
        clientDept: projectData.clientDept,
        planStartDate: projectData.planStartDate,
        planEndDate: projectData.planEndDate,
        contractAmount: projectData.contractAmount,
        // 计件制专用
        demandName: projectData.demandName,
        // 预算
        laborBudget: budgets.labor || [],
        travelBudget: budgets.travel || [],
        outsourceBudget: budgets.outsource || [],
        // 阶段
        stages: projectData.stages || [],
      });
    } catch (error) {
      Message.error('加载项目信息失败');
      history.push('/projects/list');
    } finally {
      setLoading(false);
    }
  }

  // 提交变更申请
  function handleSubmit() {
    formRef.current?.validate().then(
      async (values) => {
        // 根据业务规则进行额外验证
        const errors: string[] = [];

        // 项目制/计件制：人力预算必填，至少一条记录，且每条记录必须完整
        if (
          projectType === '项目制' ||
          (projectType === '计件制' &&
            values.laborBudget &&
            values.laborBudget.length > 0)
        ) {
          if (values.laborBudget && values.laborBudget.length > 0) {
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

        // 变更说明和附件必填
        if (!values.description) {
          errors.push('变更说明为必填项');
        }
        if (
          !values.attachmentUrl ||
          (Array.isArray(values.attachmentUrl) &&
            values.attachmentUrl.length === 0)
        ) {
          errors.push('变更附件为必填项');
        }

        if (errors.length > 0) {
          Message.error(errors.join('；'));
          return;
        }

        setLoading(true);
        try {
          // TODO: 调用创建变更申请API
          console.log('提交变更数据:', values);
          Message.success('变更申请提交成功');
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

  if (!project) {
    return <div>加载中...</div>;
  }

  // 根据业务规则：计件制只支持需求变更，不显示框架协议信息
  const isPiecework = projectType === '计件制';
  const isProjectBased = projectType === '项目制';
  const isOffshoreOrOnsite =
    projectType === '离岸制' || projectType === '驻场制';

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
          laborBudget: [],
          travelBudget: [],
          outsourceBudget: [],
          stages: [],
        }}
      >
        {/* 项目制：基本信息分组 */}
        {isProjectBased && (
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
                    field="managerName"
                    rules={[{ required: true, message: '请输入项目经理' }]}
                  >
                    <Input placeholder="请输入项目经理" />
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

        {/* 计件制：需求信息分组 */}
        {isPiecework && (
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

        {/* 离岸制/驻场制：基本信息分组（不包含商务经理和客户部） */}
        {isOffshoreOrOnsite && (
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
                    field="managerName"
                    rules={[{ required: true, message: '请输入项目经理' }]}
                  >
                    <Input placeholder="请输入项目经理" />
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
              </Row>
            </Card>
          </div>
        )}

        {/* 预算录入分组（仅项目制/计件制） */}
        {(isProjectBased || isPiecework) && (
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
                    （可选，如果修改预算，至少一条记录）
                  </span>
                </Title>
                <Form.List field="laborBudget" initialValue={[]}>
                  {(fields, { add, remove }) => {
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
                        width: 150,
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
                        width: 150,
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
                        width: 150,
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
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        title: '单价（元/天）',
                        dataIndex: 'unitCost',
                        width: 150,
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
                        width: 150,
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
                                <span style={{ color: 'var(--color-text-2)' }}>
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
                          size="small"
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
                        width: 200,
                        render: (_, record, index) => (
                          <Form.Item
                            field={`travelBudget.${index}.item`}
                            rules={[
                              { required: true, message: '请输入差旅事项' },
                            ]}
                            noStyle
                          >
                            <Input placeholder="请输入差旅事项" />
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
                              placeholder="0"
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
                              placeholder="0"
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
                              placeholder="0"
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
                              placeholder="0"
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
                              placeholder="0"
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
                        width: 150,
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
                                <span style={{ color: 'var(--color-text-2)' }}>
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
                          size="small"
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
                            <Input placeholder="请输入外包事项" />
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
                            rules={[
                              { required: true, message: '请输入供应商' },
                            ]}
                            noStyle
                          >
                            <Input placeholder="请输入供应商" />
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
                          size="small"
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
        {(isProjectBased || isPiecework) && (
          <div className={styles['section-wrapper']}>
            <Card>
              <Title heading={6}>交付计划</Title>
              <Row gutter={24}>
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
                        size="small"
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

        {/* 财务信息分组 - 仅项目制/计件制 */}
        {(isProjectBased || isPiecework) && (
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
                  if (prev.contractAmount !== next.contractAmount) return true;
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

        {/* 变更说明和附件 */}
        <div className={styles['section-wrapper']}>
          <Card>
            <Title heading={6}>变更说明</Title>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="变更说明"
                  field="description"
                  rules={[{ required: true, message: '请输入变更说明' }]}
                >
                  <Input.TextArea
                    placeholder="请详细说明变更原因和内容"
                    rows={4}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="变更附件"
                  field="attachmentUrl"
                  rules={[{ required: true, message: '请上传变更附件' }]}
                >
                  <Upload
                    action="/api/upload"
                    limit={5}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </div>
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
            提交审批
          </Button>
        </Space>
      </div>
    </>
  );
}

export default ProjectChange;
