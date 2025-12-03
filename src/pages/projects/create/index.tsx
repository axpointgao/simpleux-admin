/**
 * 商业项目创建/编辑页面
 */
import React from 'react';
import { Card, Typography } from '@arco-design/web-react';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';

const { Title } = Typography;

function ProjectCreate() {
  const history = useHistory();
  const params = qs.parseUrl(window.location.href).query;
  const projectId = params.id as string;
  const isEdit = !!projectId;

  return (
    <div>
      <Card>
        <Title heading={6}>{isEdit ? '编辑项目' : '创建项目'}</Title>
        <p>{isEdit ? `编辑项目ID: ${projectId}` : '创建新项目'}</p>
        <p>表单页面开发中...</p>
      </Card>
    </div>
  );
}

export default ProjectCreate;
