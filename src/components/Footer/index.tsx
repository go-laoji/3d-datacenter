import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="Powered by Go-Laoji,with Claude Sonnet 4.5"
      links={[
        {
          key: 'iColor.Design',
          title: 'iColor.Design(另一个小玩具)',
          href: 'https://icolor.design',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
