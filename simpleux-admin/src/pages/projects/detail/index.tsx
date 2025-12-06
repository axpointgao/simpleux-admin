/**
 * 商业项目详情页面
 */
import React from 'react';
import { Card, Typography } from '@arco-design/web-react';
import { useHistory } from 'react-router-dom';
import qs from 'query-string';

const { Title } = Typography;

function ProjectDetail() {
  const history = useHistory();
  const params = qs.parseUrl(window.location.href).query;
  const projectId = params.id as string;

  return (
    <div>
      <Card>
        <Title heading={6}>项目详情</Title>
        <p>项目ID: {projectId}</p>
        <p>详情页面开发中...</p>
      </Card>
    </div>
  );
}

export default ProjectDetail;
