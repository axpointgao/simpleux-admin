/**
 * 计件项目列表搜索表单
 */
import React from 'react';
import { Form, Input, Select, Grid } from '@arco-design/web-react';
import styles from './style/index.module.less';

const { Row, Col } = Grid;
const { useForm } = Form;

interface SearchFormProps {
  onSearch: (values: Record<string, any>) => void;
}

function SearchForm({ onSearch }: SearchFormProps) {
  const [form] = useForm();

  // 监听表单值变化，实时搜索
  const handleValuesChange = (
    changedValues: any,
    allValues: Record<string, any>
  ) => {
    onSearch(allValues);
  };

  // 固定使用中文布局，一列4个组件，所以 span={6}
  const colSpan = 6;

  return (
    <div className={styles['search-form-wrapper']}>
      <Form
        form={form}
        className={styles['search-form']}
        labelAlign="left"
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 19 }}
        onValuesChange={handleValuesChange}
      >
        <Row gutter={24}>
          <Col span={colSpan}>
            <Form.Item label="计件项目" field="keyword">
              <Input placeholder="请输入计件项目" allowClear />
            </Form.Item>
          </Col>
          <Col span={colSpan}>
            <Form.Item label="项目经理" field="manager">
              <Select placeholder="请选择项目经理" mode="multiple" allowClear>
                <Select.Option value="张三">张三</Select.Option>
                <Select.Option value="李四">李四</Select.Option>
                <Select.Option value="王五">王五</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={colSpan}>
            <Form.Item label="归属部门" field="group">
              <Select placeholder="请选择部门" mode="multiple" allowClear>
                <Select.Option value="设计一部">设计一部</Select.Option>
                <Select.Option value="设计二部">设计二部</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={colSpan}>
            <Form.Item label="客户部" field="clientDept">
              <Select placeholder="请选择客户部" mode="multiple" allowClear>
                <Select.Option value="金融客户部">金融客户部</Select.Option>
                <Select.Option value="电商客户部">电商客户部</Select.Option>
                <Select.Option value="企业客户部">企业客户部</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default SearchForm;
