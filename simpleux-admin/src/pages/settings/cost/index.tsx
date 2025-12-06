/**
 * 人日成本设置页面
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Typography,
  Message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  InputNumber,
  Popconfirm,
  Divider,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import {
  getCostStandards,
  createCostStandard,
  updateCostStandard,
  deleteCostStandard,
  getCityTypes,
  createCityType,
  type CostStandard,
  type CostStandardCreateInput,
  type CostStandardUpdateInput,
} from '@/api/cost-standards';
import { EMPLOYEE_LEVELS } from '@/utils/projectConstants';
import styles from './style/index.module.less';

const { Title } = Typography;
const FormItem = Form.Item;

function CostSettings() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CostStandard[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CostStandard | null>(null);
  const [form] = Form.useForm();
  const [cityTypes, setCityTypes] = useState<string[]>([]);
  const [newCityTypeInput, setNewCityTypeInput] = useState('');
  // 使用 useWatch 监听 city_costs 字段变化，用于表格数据更新
  const cityCosts = Form.useWatch('city_costs', form) || [];

  // 获取城市类型列表（获取所有城市类型，包括禁用的）
  // 添加简单的内存缓存，避免重复请求
  const fetchCityTypes = async (forceRefresh = false) => {
    try {
      // 如果已有数据且不是强制刷新，直接返回
      if (!forceRefresh && cityTypes.length > 0) {
        return;
      }

      console.log('fetchCityTypes - 开始获取城市类型');
      const types = await getCityTypes();
      console.log('fetchCityTypes - 获取到的城市类型:', types);
      setCityTypes(types);
      console.log('fetchCityTypes - 已设置城市类型到状态:', types);
    } catch (error) {
      console.error('获取城市类型失败:', error);
      Message.error(
        '获取城市类型失败: ' +
          (error instanceof Error ? error.message : '未知错误')
      );
    }
  };

  // 获取成本标准列表（获取所有数据，不分页，用于矩阵显示）
  const fetchData = async (page?: number) => {
    setLoading(true);
    try {
      // 获取所有数据，不分页（数据量很小，直接获取所有）
      const result = await getCostStandards({
        current: 1,
        pageSize: 1000, // 足够大的值，实际数据量很小
      });

      // 检查组件是否已卸载
      // 注意：这里无法直接检查，但可以通过 try-catch 确保安全

      // 后端已经计算了状态，直接使用
      console.log('fetchData - 返回结果:', {
        dataCount: result.data.length,
        total: result.total,
        firstItem: result.data[0] || null,
        fullResult: result,
      });
      setData(result.data || []);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: result.total || 0,
      }));
    } catch (error: any) {
      console.error('fetchData - 错误:', error);
      // 确保即使出错也设置空数据，避免页面崩溃
      // 只有在组件仍然挂载时才显示错误消息
      try {
        setData([]);
        setPagination((prev) => ({
          ...prev,
          current: 1,
          total: 0,
        }));
        Message.error(error.message || '获取成本标准列表失败');
      } catch (setStateError) {
        // 组件可能已卸载，忽略状态更新错误
        console.warn('组件已卸载，跳过状态更新');
      }
    } finally {
      try {
        setLoading(false);
      } catch (setStateError) {
        // 组件可能已卸载，忽略状态更新错误
        console.warn('组件已卸载，跳过 loading 状态更新');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 并行加载数据
    Promise.all([fetchData(), fetchCityTypes()]).catch((error) => {
      console.error('初始化数据加载失败:', error);
    });

    // 清理函数：防止组件卸载后更新状态
    return () => {
      isMounted = false;
    };
  }, []); // 只在组件挂载时获取一次，因为矩阵表格不需要分页

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date: any): string | null => {
    if (!date) return null;

    // 如果是字符串，直接返回（假设已经是 YYYY-MM-DD 格式）
    if (typeof date === 'string') {
      // 如果是 ISO 格式字符串，转换为 YYYY-MM-DD
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }

    // 如果是 Date 对象
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 如果是 dayjs 对象（Arco Design DatePicker 可能返回 dayjs）
    // dayjs 对象有 format 方法
    if (date && typeof date.format === 'function') {
      try {
        return date.format('YYYY-MM-DD');
      } catch (e) {
        console.warn('dayjs format 失败:', e);
      }
    }

    // 如果是 dayjs 对象（检查 dayjs 特有的内部属性）
    if (date && date.$y !== undefined) {
      const year = date.$y;
      const month = String((date.$M || 0) + 1).padStart(2, '0');
      const day = String(date.$D || 1).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    console.warn('无法识别的日期格式:', date, typeof date);
    return null;
  };

  // 处理创建/编辑（批量处理）
  const handleSubmit = async (values: any) => {
    try {
      console.log('原始表单值:', values);

      const effectiveFrom = formatDate(values.effective_from);
      if (!effectiveFrom) {
        Message.error('请选择生效日期');
        return;
      }

      if (!values.employee_level) {
        Message.error('请选择员工级别');
        return;
      }

      // 批量处理城市成本
      const cityCosts = values.city_costs || [];
      const validCosts = cityCosts.filter(
        (item: any) => item.city_type && item.daily_cost && item.daily_cost > 0
      );

      if (validCosts.length === 0) {
        Message.error('请至少填写一个城市的成本');
        return;
      }

      // 先创建新城市类型（如果有）
      const newCities = validCosts.filter(
        (item: any) => item.isNew && !cityTypes.includes(item.city_type)
      );
      const cityNameSet = new Set<string>(
        newCities.map((item: any) => item.city_type as string)
      );
      const uniqueNewCities = Array.from(cityNameSet);

      for (const cityName of uniqueNewCities) {
        try {
          await createCityType(cityName, cityName);
          console.log('新城市类型已创建:', cityName);
        } catch (error: any) {
          console.warn('创建城市类型失败（可能已存在）:', cityName, error);
          // 如果城市类型已存在，继续执行
        }
      }

      // 批量创建/更新成本标准
      const promises = validCosts.map(async (item: any) => {
        const costData = {
          employee_level: values.employee_level,
          city_type: item.city_type,
          daily_cost: item.daily_cost,
          effective_from: effectiveFrom,
        };

        if (item.id && editingItem) {
          // 更新现有记录
          return updateCostStandard(item.id, costData);
        } else {
          // 创建新记录
          return createCostStandard(costData);
        }
      });

      await Promise.all(promises);
      Message.success(editingItem ? '更新成功' : '创建成功');

      setFormVisible(false);
      setEditingItem(null);
      form.resetFields();
      setNewCityTypeInput('');

      await fetchData(1);
      fetchCityTypes(true); // 强制刷新城市类型列表（因为可能添加了新城市）
    } catch (error: any) {
      console.error('提交失败:', error);
      let errorMessage = '操作失败';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Message.error(errorMessage);
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteCostStandard(id);
      Message.success('删除成功');
      fetchData();
      fetchCityTypes(); // 刷新城市类型列表
    } catch (error: any) {
      Message.error(error.message || '删除失败');
    }
  };

  // 添加新城市行（在弹窗表格中）
  const handleAddCityRow = () => {
    const currentCityCosts = form.getFieldValue('city_costs') || [];
    const newRow = {
      city_type: '', // 新城市，待输入
      daily_cost: undefined,
      isNew: true, // 标记为新添加的城市
    };
    form.setFieldValue('city_costs', [...currentCityCosts, newRow]);
  };

  // 删除城市行（在弹窗表格中）
  const handleRemoveCityRow = (index: number) => {
    const currentCityCosts = form.getFieldValue('city_costs') || [];
    const newCityCosts = currentCityCosts.filter(
      (_: any, i: number) => i !== index
    );
    form.setFieldValue('city_costs', newCityCosts);
  };

  // 打开创建表单
  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setNewCityTypeInput(''); // 清空城市类型输入框

    // 初始化表单数据：每个已有城市一行
    const formData: any = {
      effective_from: new Date(),
      city_costs: cityTypes.map((city) => ({
        city_type: city,
        daily_cost: undefined,
        isNew: false,
      })),
    };

    form.setFieldsValue(formData);
    setFormVisible(true);
  };

  // 打开编辑表单（按级别和生效日期编辑）
  const handleEditLevelAndDate = (
    employeeLevel: string,
    effectiveFrom: string
  ) => {
    // 获取该级别+生效日期的所有城市成本标准
    const levelData = data.filter(
      (item) =>
        item.employee_level === employeeLevel &&
        item.effective_from === effectiveFrom
    );

    // 构建表单数据：每个已有城市一行
    const formData: any = {
      employee_level: employeeLevel,
      effective_from: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      city_costs: cityTypes.map((city) => {
        const existing = levelData.find((item) => item.city_type === city);
        return {
          city_type: city,
          daily_cost: existing?.daily_cost || undefined,
          id: existing?.id,
          isNew: false,
        };
      }),
    };

    setEditingItem({
      employee_level: employeeLevel,
      effective_from: effectiveFrom,
    } as any);
    form.setFieldsValue(formData);
    setFormVisible(true);
  };

  // 打开编辑表单（按级别编辑，用于创建新记录）
  const handleEditLevel = (employeeLevel: string) => {
    // 获取该级别的所有城市成本标准（只取最新的生效记录）
    const levelData = data.filter(
      (item) => item.employee_level === employeeLevel && item.status === '生效'
    );

    // 按城市分组，取最新的记录
    const cityDataMap: Record<string, CostStandard> = {};
    levelData.forEach((item) => {
      const existing = cityDataMap[item.city_type];
      if (
        !existing ||
        new Date(item.effective_from) > new Date(existing.effective_from)
      ) {
        cityDataMap[item.city_type] = item;
      }
    });

    // 构建表单数据：每个已有城市一行
    const formData: any = {
      employee_level: employeeLevel,
      effective_from: new Date(),
      city_costs: cityTypes.map((city) => {
        const existing = cityDataMap[city];
        return {
          city_type: city,
          daily_cost: existing?.daily_cost || undefined,
          id: existing?.id,
          isNew: false,
        };
      }),
    };

    setEditingItem({ employee_level: employeeLevel } as any);
    form.setFieldsValue(formData);
    setFormVisible(true);
  };

  // 打开编辑表单（单条记录，保留用于兼容）
  const handleEdit = (record: CostStandard) => {
    handleEditLevelAndDate(record.employee_level, record.effective_from);
  };

  // 将数据转换为矩阵格式：按（员工级别 + 生效日期）分组
  // 只显示状态为"生效"或"未生效"的记录，不显示"失效"的记录
  const matrixData = useMemo(() => {
    // 过滤掉失效的记录
    const validData = data.filter((item) => item.status !== '失效');

    // 按（员工级别 + 生效日期）分组
    const groupedByLevelAndDate: Record<
      string,
      Record<string, CostStandard>
    > = {};

    validData.forEach((item) => {
      const key = `${item.employee_level}_${item.effective_from}`;
      if (!groupedByLevelAndDate[key]) {
        groupedByLevelAndDate[key] = {};
      }
      groupedByLevelAndDate[key][item.city_type] = item;
    });

    // 转换为表格数据格式
    const rows: any[] = [];

    Object.keys(groupedByLevelAndDate).forEach((key) => {
      const [employeeLevel, effectiveFrom] = key.split('_');
      const cityData = groupedByLevelAndDate[key];

      // 获取该行的状态（所有城市的状态应该相同，取第一个）
      const firstCity = Object.values(cityData)[0];
      const rowStatus = firstCity?.status || '未知';

      const row: any = {
        employee_level: employeeLevel,
        effective_from: effectiveFrom,
        status: rowStatus,
        rowKey: key, // 用于 rowKey
      };

      // 为每个城市添加成本
      cityTypes.forEach((city) => {
        const costStandard = cityData[city];
        row[city] = costStandard
          ? {
              id: costStandard.id,
              daily_cost: costStandard.daily_cost,
            }
          : null;
      });

      rows.push(row);
    });

    // 排序：先按员工级别，再按生效日期倒序（最新的在前面）
    rows.sort((a, b) => {
      if (a.employee_level !== b.employee_level) {
        return (
          EMPLOYEE_LEVELS.indexOf(a.employee_level) -
          EMPLOYEE_LEVELS.indexOf(b.employee_level)
        );
      }
      return (
        new Date(b.effective_from).getTime() -
        new Date(a.effective_from).getTime()
      );
    });

    return rows;
  }, [data, cityTypes]);

  // 动态生成列：员工级别 + 生效日期 + 状态 + 每个城市类型一列 + 操作列
  const columns = useMemo(() => {
    const cols: any[] = [
      {
        title: '员工级别',
        dataIndex: 'employee_level',
        width: 120,
        fixed: 'left' as const,
        sorter: (a: any, b: any) => {
          return (
            EMPLOYEE_LEVELS.indexOf(a.employee_level) -
            EMPLOYEE_LEVELS.indexOf(b.employee_level)
          );
        },
        filters: EMPLOYEE_LEVELS.map((level) => ({
          text: level,
          value: level,
        })),
        onFilter: (value: string, record: any) =>
          record.employee_level === value,
      },
      {
        title: '生效日期',
        dataIndex: 'effective_from',
        width: 120,
        fixed: 'left' as const,
        sorter: (a: any, b: any) => {
          return (
            new Date(a.effective_from).getTime() -
            new Date(b.effective_from).getTime()
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        fixed: 'left' as const,
        filters: [
          { text: '生效', value: '生效' },
          { text: '未生效', value: '未生效' },
        ],
        onFilter: (value: string, record: any) => record.status === value,
        render: (value: '生效' | '失效' | '未生效') => {
          const colorMap = {
            生效: 'green',
            失效: 'gray',
            未生效: 'orange',
          };
          return (
            <span
              style={{ color: colorMap[value] || 'black', fontWeight: 'bold' }}
            >
              {value}
            </span>
          );
        },
      },
    ];

    // 为每个城市类型添加一列
    cityTypes.forEach((city) => {
      cols.push({
        title: city,
        dataIndex: city,
        width: 120,
        render: (value: any) => {
          if (!value) {
            return <span style={{ color: '#999' }}>-</span>;
          }
          return (
            <span style={{ fontWeight: 'bold' }}>
              {value.daily_cost.toLocaleString('zh-CN')} 元
            </span>
          );
        },
      });
    });

    cols.push({
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button
          type="text"
          size="small"
          icon={<IconEdit />}
          onClick={() =>
            handleEditLevelAndDate(record.employee_level, record.effective_from)
          }
        >
          编辑
        </Button>
      ),
    });

    return cols;
  }, [cityTypes]);

  return (
    <Card>
      <div className={styles.header}>
        <Title heading={6}>人日成本设置</Title>
        <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>
          新增成本标准
        </Button>
      </div>

      <Table
        rowKey="rowKey"
        loading={loading}
        columns={columns}
        data={matrixData}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingItem ? '编辑成本标准' : '新增成本标准'}
        visible={formVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setFormVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        style={{ width: 800 }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          initialValues={{}}
        >
          <FormItem
            label="员工级别"
            field="employee_level"
            rules={[{ required: true, message: '请选择员工级别' }]}
          >
            <Select placeholder="请选择员工级别" disabled={!!editingItem}>
              {EMPLOYEE_LEVELS.map((level) => (
                <Select.Option key={level} value={level}>
                  {level}
                </Select.Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            label="生效日期"
            field="effective_from"
            rules={[{ required: true, message: '请选择生效日期' }]}
          >
            <DatePicker
              placeholder="请选择生效日期"
              style={{ width: '100%' }}
              disabled={!!editingItem}
            />
          </FormItem>

          <FormItem
            label="各城市人日成本（元）"
            field="city_costs"
            rules={[
              {
                validator: (value, callback) => {
                  if (!value || value.length === 0) {
                    callback('请至少填写一个城市的成本');
                    return;
                  }
                  const hasValidCost = value.some(
                    (item: any) =>
                      item.city_type && item.daily_cost && item.daily_cost > 0
                  );
                  if (!hasValidCost) {
                    callback('请至少填写一个有效的成本（大于 0）');
                    return;
                  }
                  callback();
                },
              },
            ]}
          >
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <Table
                data={cityCosts}
                columns={[
                  {
                    title: '城市类型',
                    dataIndex: 'city_type',
                    width: 200,
                    render: (value: string, record: any, index: number) => {
                      // 如果是已有城市，显示为只读；如果是新城市，显示输入框
                      if (record.isNew) {
                        return (
                          <FormItem
                            field={`city_costs.${index}.city_type`}
                            rules={[
                              { required: true, message: '请输入城市类型' },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              placeholder="请输入城市类型"
                              style={{ width: '100%' }}
                            />
                          </FormItem>
                        );
                      }
                      return (
                        <span style={{ fontWeight: 'bold' }}>{value}</span>
                      );
                    },
                  },
                  {
                    title: '人日成本（元）',
                    dataIndex: 'daily_cost',
                    render: (value: any, record: any, index: number) => (
                      <FormItem
                        field={`city_costs.${index}.daily_cost`}
                        rules={[
                          {
                            type: 'number',
                            min: 0.01,
                            message: '成本必须大于 0',
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="请输入成本"
                          min={0.01}
                          precision={2}
                          style={{ width: '100%' }}
                        />
                      </FormItem>
                    ),
                  },
                  {
                    title: '操作',
                    width: 80,
                    render: (_: any, record: any, index: number) => {
                      // 已有城市不能删除，新添加的城市可以删除
                      if (record.isNew) {
                        return (
                          <Button
                            type="text"
                            size="small"
                            icon={<IconDelete />}
                            onClick={() => handleRemoveCityRow(index)}
                            style={{ color: 'var(--color-danger)' }}
                          >
                            删除
                          </Button>
                        );
                      }
                      return null;
                    },
                  },
                ]}
                pagination={false}
                rowKey={(record: any) =>
                  record.isNew
                    ? `new-${record.city_type || Math.random()}`
                    : record.city_type
                }
                showHeader={true}
              />
              <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                <Button
                  type="dashed"
                  icon={<IconPlus />}
                  onClick={handleAddCityRow}
                  style={{ width: '100%' }}
                >
                  添加城市
                </Button>
              </div>
            </div>
          </FormItem>
        </Form>
      </Modal>
    </Card>
  );
}

export default CostSettings;
