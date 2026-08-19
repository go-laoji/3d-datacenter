import { history, useIntl } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const ForbiddenPage: React.FC = () => {
  const intl = useIntl();
  return (
    <Card variant="borderless">
      <Result
        status="403"
        title="无权限访问"
        subTitle={intl.formatMessage({
          id: 'pages.403.subTitle',
          defaultMessage: '当前账号没有访问该资源的权限，请联系管理员。',
        })}
        extra={
          <Button type="primary" onClick={() => history.push('/dashboard')}>
            {intl.formatMessage({
              id: 'pages.403.buttonText',
              defaultMessage: '返回工作台',
            })}
          </Button>
        }
      />
    </Card>
  );
};

export default ForbiddenPage;
