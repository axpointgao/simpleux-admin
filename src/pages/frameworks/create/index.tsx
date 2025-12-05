/**
 * 计件项目创建/编辑页面
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Space,
  Message,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';
import {
  getFrameworkById,
  createFramework,
  updateFramework,
} from '../list/mock';
import { FrameworkAgreement } from '@/types/framework';
import styles from './style/index.module.less';

function FrameworkCreate() {
  const history = useHistory();
  const formRef = useRef<FormInstance>();
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState<FrameworkAgreement | null>(null);

  const params = qs.parseUrl(window.location.href).query;
  const frameworkId = params.id as string;
  const isEdit = !!frameworkId;

  // 加载计件项目数据（编辑模式）
  useEffect(() => {
    if (isEdit && frameworkId) {
      loadFramework();
    }
  }, [isEdit, frameworkId]);

  async function loadFramework() {
    if (!frameworkId) return;
    setLoading(true);
    try {
      const data = await getFrameworkById(frameworkId);
      if (data) {
        setFramework(data);
        formRef.current?.setFieldsValue({
          name: data.name,
          managerId: data.managerId,
          managerName: data.managerName,
          bizManager: data.bizManager || '',
          group: data.group,
          clientDept: data.clientDept || '',
        });
      }
    } catch (error) {
      Message.error('加载计件项目失败');
    } finally {
      setLoading(false);
    }
  }

  // 提交表单
  async function handleSubmit() {
    try {
      const values = await formRef.current?.validate();

      setLoading(true);

      // 确保 managerName 有值（如果表单中没有，从 managerId 映射获取）
      const managerNameMap: Record<string, string> = {
        user1: '张三',
        user2: '李四',
        user3: '王五',
      };
      const managerName =
        values.managerName ||
        managerNameMap[values.managerId] ||
        values.managerId;

      if (isEdit && frameworkId) {
        // 更新计件项目
        await updateFramework(frameworkId, {
          name: values.name,
          managerId: values.managerId,
          managerName: managerName,
          bizManager: values.bizManager,
          group: values.group,
          clientDept: values.clientDept,
        });
        Message.success('更新成功');
      } else {
        // 创建计件项目
        await createFramework({
          name: values.name,
          managerId: values.managerId,
          managerName: managerName,
          bizManager: values.bizManager,
          group: values.group,
          clientDept: values.clientDept,
        });
        Message.success('创建成功');
      }

      // 返回列表页
      history.push('/frameworks/list');
    } catch (error: any) {
      if (error?.fields) {
        // 表单验证错误已在Form组件中显示
        return;
      }
      Message.error(error?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.wrapper}>
          <Form
            ref={formRef}
            layout="horizontal"
            labelAlign="left"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            autoComplete="off"
            className={styles.form}
          >
            <Form.Item
              label="计件项目名称"
              field="name"
              rules={[{ required: true, message: '请输入计件项目名称' }]}
            >
              <Input placeholder="请输入计件项目名称" />
            </Form.Item>

            <Form.Item
              label="项目经理"
              field="managerId"
              rules={[{ required: true, message: '请选择项目经理' }]}
            >
              <Select
                placeholder="请选择项目经理"
                onChange={(value) => {
                  // 根据 value 设置 managerName
                  const managerNameMap: Record<string, string> = {
                    user1: '张三',
                    user2: '李四',
                    user3: '王五',
                  };
                  const managerName = managerNameMap[value] || value;
                  formRef.current?.setFieldsValue({
                    managerId: value,
                    managerName: managerName,
                  });
                }}
              >
                <Select.Option value="user1">张三</Select.Option>
                <Select.Option value="user2">李四</Select.Option>
                <Select.Option value="user3">王五</Select.Option>
              </Select>
            </Form.Item>
            {/* 隐藏字段，用于保存 managerName */}
            <Form.Item field="managerName" style={{ display: 'none' }}>
              <Input />
            </Form.Item>

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

            <Form.Item label="商务经理" field="bizManager">
              <Input placeholder="请输入商务经理" />
            </Form.Item>

            <Form.Item label="客户部" field="clientDept">
              <Select placeholder="请选择客户部" allowClear>
                <Select.Option value="金融客户部">金融客户部</Select.Option>
                <Select.Option value="电商客户部">电商客户部</Select.Option>
                <Select.Option value="企业客户部">企业客户部</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label=" ">
              <Space>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
                <Button
                  size="large"
                  onClick={() => history.push('/frameworks/list')}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
}

export default FrameworkCreate;
