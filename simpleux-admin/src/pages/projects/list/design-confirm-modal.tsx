/**
 * 设计确认申请弹窗
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Upload,
  Message,
  Button,
} from '@arco-design/web-react';
import { IconUpload } from '@arco-design/web-react/icon';
import { Project } from '@/types';

interface DesignConfirmModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (data: {
    description?: string;
    attachmentUrl: string;
  }) => Promise<void>;
}

function DesignConfirmModal({
  visible,
  project,
  onClose,
  onConfirm,
}: DesignConfirmModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setFileList([]);
    }
  }, [visible, form]);

  // 处理附件上传
  const handleFileChange = (fileList: any[]) => {
    setFileList(fileList);
    // 如果有文件，设置到表单中
    if (fileList.length > 0) {
      const file = fileList[0];
      // 优先使用 response.url（上传成功后的URL），其次使用 url（已有文件），最后使用临时标识
      const url = file.response?.url || file.url || `temp_${file.uid}`;
      form.setFieldValue('attachmentUrl', url);
    } else {
      form.setFieldValue('attachmentUrl', undefined);
    }
  };

  // 提交
  const handleSubmit = async () => {
    try {
      const values = await form.validate();

      // 验证附件必填
      if (!values.attachmentUrl || fileList.length === 0) {
        Message.error('请上传客户确认的邮件或IM截图');
        return;
      }

      setLoading(true);
      await onConfirm({
        description: values.description,
        attachmentUrl: values.attachmentUrl,
      });
      Message.success('设计确认申请提交成功');
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

  return (
    <Modal
      title="发起设计确认"
      visible={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      style={{ width: 600 }}
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

        <Form.Item label="确认说明" field="description" rules={[]}>
          <Input.TextArea
            placeholder="请输入确认说明（可选）"
            rows={4}
            maxLength={500}
            showWordLimit
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              确认附件
              <span style={{ color: '#F53F3F', marginLeft: 4 }}>*</span>
            </span>
          }
          field="attachmentUrl"
          rules={[{ required: true, message: '请上传客户确认的邮件或IM截图' }]}
        >
          <div>
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              limit={1}
              accept="image/*,.pdf"
              action="/api/upload"
              onExceedLimit={() => {
                Message.warning('最多只能上传1个文件');
              }}
              onRemove={() => {
                setFileList([]);
                form.setFieldValue('attachmentUrl', undefined);
              }}
              showUploadList={true}
            >
              <Button type="secondary" icon={<IconUpload />}>
                上传附件
              </Button>
            </Upload>
            {fileList.length === 0 && (
              <div
                style={{
                  color: 'var(--color-text-3)',
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                支持上传客户确认的邮件截图或IM截图（图片或PDF格式）
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default DesignConfirmModal;
