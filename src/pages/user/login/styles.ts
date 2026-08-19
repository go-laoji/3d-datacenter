import { createStyles } from 'antd-style';

export const useLoginStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    overflow: 'auto',
    background: `
      radial-gradient(circle at 18% 18%, ${token.colorPrimaryBg} 0, transparent 34%),
      radial-gradient(circle at 82% 72%, ${token.colorInfoBg} 0, transparent 38%),
      ${token.colorBgLayout}
    `,
  },
  content: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  },
  panel: {
    width: '100%',
    maxWidth: 440,
    padding: '32px 36px 20px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG * 2,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary,
  },
  identityHint: {
    marginBottom: 24,
  },
}));
