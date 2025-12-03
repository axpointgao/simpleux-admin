/**
 * 商业项目列表搜索表单
 */
import React from 'react';
import { Form, Input, Select, Grid } from '@arco-design/web-react';
import useLocale from '@/utils/useLocale';
import locale from './locale';
import styles from './style/index.module.less';

const { Row, Col } = Grid;
const { useForm } = Form;

interface SearchFormProps {
  onSearch: (values: Record<string, any>) => void;
}

function SearchForm({ onSearch }: SearchFormProps) {
  const t = useLocale(locale);
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
            <Form.Item label="项目/需求" field="keyword">
              <Input placeholder="请输入项目名称或需求名称" allowClear />
            </Form.Item>
          </Col>
          <Col span={colSpan}>
            <Form.Item label={t['projects.list.type']} field="type">
              <Select placeholder="请选择类型" mode="multiple" allowClear>
                <Select.Option value="项目制">
                  {t['projects.list.type.项目制']}
                </Select.Option>
                <Select.Option value="计件制">
                  {t['projects.list.type.计件制']}
                </Select.Option>
                <Select.Option value="离岸制">
                  {t['projects.list.type.离岸制']}
                </Select.Option>
                <Select.Option value="驻场制">
                  {t['projects.list.type.驻场制']}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={colSpan}>
            <Form.Item label={t['projects.list.status']} field="status">
              <Select placeholder="请选择状态" mode="multiple" allowClear>
                <Select.Option value="待启动">待启动</Select.Option>
                <Select.Option value="进行中">
                  {t['projects.list.status.进行中']}
                </Select.Option>
                <Select.Option value="待确认">
                  {t['projects.list.status.待确认']}
                </Select.Option>
                <Select.Option value="已确认">
                  {t['projects.list.status.已确认']}
                </Select.Option>
                <Select.Option value="已归档">
                  {t['projects.list.status.已归档']}
                </Select.Option>
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
        </Row>
      </Form>
    </div>
  );
}

export default SearchForm;
