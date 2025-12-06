/**
 * 用户管理页面
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  PaginationProps,
  Button,
  Space,
  Typography,
  Message,
  Modal,
  Tag,
  Tree,
  Input,
  Select,
  Form,
  Drawer,
  Divider,
} from '@arco-design/web-react';
import {
  IconRefresh,
  IconEdit,
  IconSearch,
  IconPlus,
} from '@arco-design/web-react/icon';
import {
  getUsers,
  updateUser,
  batchUpdateUsers,
  getDepartmentTree,
  getRoles,
  syncDingtalk,
  getDingtalkSyncStatus,
  type User,
  type DepartmentTreeNode,
  type Role,
} from '@/api/users';
import { EMPLOYEE_LEVELS } from '@/utils/projectConstants';
import { getCityTypes } from '@/api/cost-standards';
import styles from './style/index.module.less';

const { Title } = Typography;
const { Option } = Select;

interface UserEditFormData {
  employee_level: string;
  city_type: string;
  role_ids: string[];
}

function UserManagement() {
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationProps>({
    sizeCanChange: true,
    showTotal: true,
    pageSize: 10,
    current: 1,
    pageSizeChangeResetCurrent: true,
  });
  const [loading, setLoading] = useState(true);
  const [formParams, setFormParams] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>(
    []
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm<UserEditFormData>();
  const [batchEditModalVisible, setBatchEditModalVisible] = useState(false);
  const [batchEditForm] = Form.useForm();
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncForm] = Form.useForm();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [cityTypes, setCityTypes] = useState<string[]>([]);
  const [newCityTypeInput, setNewCityTypeInput] = useState('');
  const [batchNewCityTypeInput, setBatchNewCityTypeInput] = useState('');

  // 获取部门树
  useEffect(() => {
    fetchDepartmentTree();
    fetchRoles();
    fetchSyncStatus();
    fetchCityTypes();
  }, []);

  // 获取城市类型列表
  async function fetchCityTypes() {
    try {
      const types = await getCityTypes();
      setCityTypes(types);
    } catch (error: any) {
      console.error('获取城市类型失败:', error);
      // 如果获取失败，使用默认值
      setCityTypes(['Chengdu', 'Hangzhou']);
    }
  }

  // 获取用户列表
  useEffect(() => {
    fetchData();
  }, [
    pagination.current,
    pagination.pageSize,
    JSON.stringify(formParams),
    selectedDepartment,
  ]);

  async function fetchDepartmentTree() {
    try {
      const tree = await getDepartmentTree();
      setDepartmentTree(tree);
    } catch (error: any) {
      Message.error(error.message || '获取部门列表失败');
    }
  }

  async function fetchRoles() {
    try {
      const roleList = await getRoles();
      setRoles(roleList);
    } catch (error: any) {
      Message.error(error.message || '获取角色列表失败');
    }
  }

  async function fetchSyncStatus() {
    try {
      const status = await getDingtalkSyncStatus();
      setSyncStatus(status);
    } catch (error: any) {
      console.error('获取同步状态失败:', error);
    }
  }

  function fetchData() {
    setLoading(true);
    const { current, pageSize } = pagination;
    const params: any = {
      current,
      pageSize,
      ...formParams,
    };

    if (selectedDepartment) {
      params.department = [selectedDepartment];
    }

    getUsers(params)
      .then((result) => {
        setData(result.data);
        setPagination({
          ...pagination,
          current,
          pageSize,
          total: result.total,
        });
      })
      .catch((error: any) => {
        Message.error(error.message || '获取用户列表失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function onChangeTable({ current, pageSize }: PaginationProps) {
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
  }

  function handleSearch(params: Record<string, any>) {
    setFormParams(params);
    setPagination({ ...pagination, current: 1 });
  }

  function handleDepartmentSelect(keys: string[]) {
    if (keys.length > 0) {
      setSelectedDepartment(keys[0]);
    } else {
      setSelectedDepartment(null);
    }
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    editForm.setFieldsValue({
      employee_level: user.employee_level,
      city_type: user.city_type || '',
      role_ids: user.roles.map((r) => r.id),
    });
    setEditModalVisible(true);
  }

  async function handleEditSubmit() {
    try {
      const values = await editForm.validate();
      if (!editingUser) return;

      await updateUser(editingUser.id, {
        employee_level: values.employee_level,
        city_type: values.city_type,
        role_ids: values.role_ids,
      });

      Message.success('更新成功');
      setEditModalVisible(false);
      fetchData();
    } catch (error: any) {
      Message.error(error.message || '更新失败');
    }
  }

  function handleBatchEdit() {
    if (selectedRowKeys.length === 0) {
      Message.warning('请先选择要编辑的用户');
      return;
    }
    batchEditForm.resetFields();
    setBatchEditModalVisible(true);
  }

  async function handleBatchEditSubmit() {
    try {
      const values = await batchEditForm.validate();
      const updateData: any = {};

      if (values.employee_level) {
        updateData.employee_level = values.employee_level;
      }
      if (values.city_type) {
        updateData.city_type = values.city_type;
      }
      if (values.role_ids && values.role_ids.length > 0) {
        updateData.role_ids = values.role_ids;
      }

      if (Object.keys(updateData).length === 0) {
        Message.warning('请至少选择一个要更新的字段');
        return;
      }

      await batchUpdateUsers({
        user_ids: selectedRowKeys,
        ...updateData,
      });

      Message.success('批量更新成功');
      setBatchEditModalVisible(false);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error: any) {
      Message.error(error.message || '批量更新失败');
    }
  }

  function handleSync() {
    syncForm.resetFields();
    syncForm.setFieldsValue({
      type: 'full',
      scope: 'all',
    });
    setSyncModalVisible(true);
  }

  async function handleSyncSubmit() {
    try {
      const values = await syncForm.validate();
      setSyncing(true);

      const result = await syncDingtalk({
        type: values.type,
        scope: values.scope,
      });

      Message.success(
        `同步完成：创建 ${result.stats.users.created} 个用户，更新 ${result.stats.users.updated} 个用户`
      );
      setSyncModalVisible(false);
      fetchData();
      fetchDepartmentTree();
      fetchSyncStatus();
    } catch (error: any) {
      Message.error(error.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 200,
      render: (value: string) => value || '-',
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '员工等级',
      dataIndex: 'employee_level',
      width: 120,
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: '城市类型',
      dataIndex: 'city_type',
      width: 120,
      render: (value: string) => (
        <Tag color="green">
          {value === 'Chengdu' ? '成都' : value === 'Hangzhou' ? '杭州' : '-'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: string) => (
        <Tag color={value === '在职' ? 'green' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 200,
      render: (roles: Array<{ code: string; name: string }>) => (
        <Space>
          {roles.map((role) => (
            <Tag key={role.code} color="purple">
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: User) => (
        <Button
          type="text"
          size="small"
          icon={<IconEdit />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  // 构建部门树数据
  const treeData = useMemo(() => {
    function buildTree(nodes: DepartmentTreeNode[]): any[] {
      return nodes.map((node) => ({
        key: node.name,
        title: `${node.name} (${node.user_count || 0})`,
        children: node.children ? buildTree(node.children) : undefined,
      }));
    }
    return buildTree(departmentTree);
  }, [departmentTree]);

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={6}>用户管理</Title>
          <Space>
            {syncStatus && (
              <span className={styles['sync-status']}>
                最后同步：
                {syncStatus.lastSyncTime
                  ? new Date(syncStatus.lastSyncTime).toLocaleString()
                  : '从未同步'}
              </span>
            )}
            <Button type="primary" icon={<IconRefresh />} onClick={handleSync}>
              同步钉钉数据
            </Button>
          </Space>
        </div>

        <div className={styles.content}>
          {/* 左侧：组织架构树 */}
          <div className={styles.sidebar}>
            <div className={styles['sidebar-header']}>组织架构</div>
            <Tree
              treeData={treeData}
              onSelect={handleDepartmentSelect}
              selectedKeys={selectedDepartment ? [selectedDepartment] : []}
            />
          </div>

          {/* 右侧：用户列表 */}
          <div className={styles.main}>
            {/* 搜索表单 */}
            <div className={styles['search-form']}>
              <Form
                layout="inline"
                onValuesChange={(_, allValues) => {
                  const searchParams: any = {};
                  if (allValues.keyword) {
                    searchParams.keyword = allValues.keyword;
                  }
                  if (allValues.employee_level) {
                    searchParams.employee_level = [allValues.employee_level];
                  }
                  if (allValues.city_type) {
                    searchParams.city_type = [allValues.city_type];
                  }
                  if (allValues.status) {
                    searchParams.status = [allValues.status];
                  }
                  handleSearch(searchParams);
                }}
              >
                <Form.Item field="keyword">
                  <Input
                    placeholder="搜索姓名或职位"
                    style={{ width: 200 }}
                    allowClear
                  />
                </Form.Item>
                <Form.Item field="employee_level">
                  <Select
                    placeholder="员工等级"
                    style={{ width: 120 }}
                    allowClear
                  >
                    {EMPLOYEE_LEVELS.map((level) => (
                      <Option key={level} value={level}>
                        {level}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item field="city_type">
                  <Select
                    placeholder="城市类型"
                    style={{ width: 120 }}
                    allowClear
                    allowCreate
                    showSearch
                  >
                    {cityTypes.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item field="status">
                  <Select placeholder="状态" style={{ width: 100 }} allowClear>
                    <Option value="在职">在职</Option>
                    <Option value="离职">离职</Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>

            {/* 批量操作 */}
            {selectedRowKeys.length > 0 && (
              <div className={styles['batch-actions']}>
                <Space>
                  <span>已选择 {selectedRowKeys.length} 项</span>
                  <Button onClick={handleBatchEdit}>批量编辑</Button>
                  <Button onClick={() => setSelectedRowKeys([])}>
                    取消选择
                  </Button>
                </Space>
              </div>
            )}

            {/* 用户表格 */}
            <Table
              rowKey="id"
              columns={columns}
              data={data}
              loading={loading}
              pagination={pagination}
              onChange={onChangeTable}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys as string[]);
                },
              }}
            />
          </div>
        </div>
      </Card>

      {/* 编辑用户对话框 */}
      <Drawer
        title="编辑用户信息"
        width={500}
        visible={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="姓名">
            <Input value={editingUser?.name} disabled />
          </Form.Item>
          <Form.Item label="部门">
            <Input value={editingUser?.department} disabled />
          </Form.Item>
          <Form.Item
            label="员工等级"
            field="employee_level"
            rules={[{ required: true, message: '请选择员工等级' }]}
          >
            <Select placeholder="请选择员工等级">
              {EMPLOYEE_LEVELS.map((level) => (
                <Option key={level} value={level}>
                  {level}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="城市类型"
            field="city_type"
            rules={[{ required: true, message: '请选择城市类型' }]}
          >
            <Select
              placeholder="请选择城市类型"
              allowClear
              showSearch
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: 0 }} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                    }}
                  >
                    <Input
                      size="small"
                      style={{ marginRight: 8 }}
                      placeholder="输入新城市类型"
                      value={newCityTypeInput}
                      onChange={(value) => setNewCityTypeInput(value)}
                      onPressEnter={() => {
                        if (
                          newCityTypeInput &&
                          cityTypes.indexOf(newCityTypeInput) === -1
                        ) {
                          const updatedTypes = [
                            ...cityTypes,
                            newCityTypeInput,
                          ].sort();
                          setCityTypes(updatedTypes);
                          editForm.setFieldValue('city_type', newCityTypeInput);
                          setNewCityTypeInput('');
                          Message.success(
                            `已添加城市类型：${newCityTypeInput}`
                          );
                        } else if (cityTypes.indexOf(newCityTypeInput) !== -1) {
                          Message.warning('该城市类型已存在');
                        }
                      }}
                    />
                    <Button
                      style={{ fontSize: 14, padding: '0 6px' }}
                      type="text"
                      size="mini"
                      onClick={() => {
                        if (
                          newCityTypeInput &&
                          cityTypes.indexOf(newCityTypeInput) === -1
                        ) {
                          const updatedTypes = [
                            ...cityTypes,
                            newCityTypeInput,
                          ].sort();
                          setCityTypes(updatedTypes);
                          editForm.setFieldValue('city_type', newCityTypeInput);
                          setNewCityTypeInput('');
                          Message.success(
                            `已添加城市类型：${newCityTypeInput}`
                          );
                        } else if (cityTypes.indexOf(newCityTypeInput) !== -1) {
                          Message.warning('该城市类型已存在');
                        }
                      }}
                    >
                      <IconPlus />
                      添加
                    </Button>
                  </div>
                </div>
              )}
            >
              {cityTypes.map((city) => (
                <Option key={city} value={city}>
                  {city}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="角色"
            field="role_ids"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色">
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 批量编辑对话框 */}
      <Drawer
        title="批量编辑用户"
        width={500}
        visible={batchEditModalVisible}
        onOk={handleBatchEditSubmit}
        onCancel={() => setBatchEditModalVisible(false)}
      >
        <Form form={batchEditForm} layout="vertical">
          <Form.Item label="员工等级" field="employee_level">
            <Select placeholder="选择员工等级（留空则不更新）" allowClear>
              {EMPLOYEE_LEVELS.map((level) => (
                <Option key={level} value={level}>
                  {level}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="城市类型" field="city_type">
            <Select
              placeholder="选择城市类型（留空则不更新）"
              allowClear
              showSearch
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <Divider style={{ margin: 0 }} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                    }}
                  >
                    <Input
                      size="small"
                      style={{ marginRight: 8 }}
                      placeholder="输入新城市类型"
                      value={batchNewCityTypeInput}
                      onChange={(value) => setBatchNewCityTypeInput(value)}
                      onPressEnter={() => {
                        if (
                          batchNewCityTypeInput &&
                          cityTypes.indexOf(batchNewCityTypeInput) === -1
                        ) {
                          const updatedTypes = [
                            ...cityTypes,
                            batchNewCityTypeInput,
                          ].sort();
                          setCityTypes(updatedTypes);
                          batchEditForm.setFieldValue(
                            'city_type',
                            batchNewCityTypeInput
                          );
                          setBatchNewCityTypeInput('');
                          Message.success(
                            `已添加城市类型：${batchNewCityTypeInput}`
                          );
                        } else if (
                          cityTypes.indexOf(batchNewCityTypeInput) !== -1
                        ) {
                          Message.warning('该城市类型已存在');
                        }
                      }}
                    />
                    <Button
                      style={{ fontSize: 14, padding: '0 6px' }}
                      type="text"
                      size="mini"
                      onClick={() => {
                        if (
                          batchNewCityTypeInput &&
                          cityTypes.indexOf(batchNewCityTypeInput) === -1
                        ) {
                          const updatedTypes = [
                            ...cityTypes,
                            batchNewCityTypeInput,
                          ].sort();
                          setCityTypes(updatedTypes);
                          batchEditForm.setFieldValue(
                            'city_type',
                            batchNewCityTypeInput
                          );
                          setBatchNewCityTypeInput('');
                          Message.success(
                            `已添加城市类型：${batchNewCityTypeInput}`
                          );
                        } else if (
                          cityTypes.indexOf(batchNewCityTypeInput) !== -1
                        ) {
                          Message.warning('该城市类型已存在');
                        }
                      }}
                    >
                      <IconPlus />
                      添加
                    </Button>
                  </div>
                </div>
              )}
            >
              {cityTypes.map((city) => (
                <Option key={city} value={city}>
                  {city}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="角色" field="role_ids">
            <Select
              mode="multiple"
              placeholder="选择角色（留空则不更新）"
              allowClear
            >
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 同步对话框 */}
      <Modal
        title="同步钉钉数据"
        visible={syncModalVisible}
        onOk={handleSyncSubmit}
        onCancel={() => setSyncModalVisible(false)}
        confirmLoading={syncing}
      >
        <Form form={syncForm} layout="vertical">
          <Form.Item
            label="同步类型"
            field="type"
            rules={[{ required: true, message: '请选择同步类型' }]}
          >
            <Select>
              <Option value="full">全量同步</Option>
              <Option value="incremental">增量同步</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="同步范围"
            field="scope"
            rules={[{ required: true, message: '请选择同步范围' }]}
          >
            <Select>
              <Option value="all">全部（部门+用户）</Option>
              <Option value="departments">仅部门</Option>
              <Option value="users">仅用户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagement;
