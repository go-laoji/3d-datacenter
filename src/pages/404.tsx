import { history, useIntl } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => {
  const intl = useIntl();
  return (
    <Card variant="borderless">
      <Result
        status="404"
        title="页面不存在"
        subTitle={intl.formatMessage({
          id: 'pages.404.subTitle',
          defaultMessage: '该地址可能已变更，请检查链接或返回工作台。',
        })}
        extra={
          <Button type="primary" onClick={() => history.push('/dashboard')}>
            {intl.formatMessage({
              id: 'pages.404.buttonText',
              defaultMessage: '返回工作台',
            })}
          </Button>
        }
      />
    </Card>
  );
};

export default NoFoundPage;
