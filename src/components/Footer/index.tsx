import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`© ${new Date().getFullYear()} TDDC 数字孪生运维平台`}
      links={[]}
    />
  );
};

export default Footer;
