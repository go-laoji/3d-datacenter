import { Alert, Button, Space } from 'antd';
import dayjs from 'dayjs';
import styles from './index.less';
import type { LayoutDraft } from './layoutEditorModel';

interface LayoutSessionBannersProps {
  draft: LayoutDraft | null;
  conflictLayout: IDC.DatacenterLayout | null;
  previewing: boolean;
  saving: boolean;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
  onCompareConflict: () => void;
  onUseServerVersion: () => void;
  onForceSave: () => void;
  onAcceptPreview: () => void;
  onCancelPreview: () => void;
}

export function LayoutSessionBanners({
  draft,
  conflictLayout,
  previewing,
  saving,
  onRestoreDraft,
  onDiscardDraft,
  onCompareConflict,
  onUseServerVersion,
  onForceSave,
  onAcceptPreview,
  onCancelPreview,
}: LayoutSessionBannersProps) {
  return (
    <div className={styles.bannerStack}>
      {draft && (
        <Alert
          type="info"
          showIcon
          message={`发现 ${dayjs(draft.savedAt).format('MM-DD HH:mm:ss')} 的本地草稿`}
          description={`草稿基于服务端 v${draft.loadedVersion}，不会自动覆盖当前布局。`}
          action={
            <Space wrap>
              <Button size="small" type="primary" onClick={onRestoreDraft}>
                恢复草稿
              </Button>
              <Button size="small" onClick={onDiscardDraft}>
                丢弃草稿
              </Button>
            </Space>
          }
        />
      )}
      {conflictLayout && (
        <Alert
          type="error"
          showIcon
          message={`保存冲突：服务端已更新到 v${conflictLayout.version}`}
          description="本地工作副本仍被保留。请先比较差异，再选择加载服务端或另存为新版本。"
          action={
            <Space wrap>
              <Button size="small" onClick={onCompareConflict}>
                比较差异
              </Button>
              <Button size="small" onClick={onUseServerVersion}>
                加载服务端
              </Button>
              <Button
                size="small"
                danger
                type="primary"
                loading={saving}
                onClick={onForceSave}
              >
                另存新版本
              </Button>
            </Space>
          }
        />
      )}
      {previewing && (
        <Alert
          type="warning"
          showIcon
          message="正在预览自动布局"
          description="当前画布为只读预览，不会改变撤销历史或本地草稿。"
          action={
            <Space wrap>
              <Button size="small" type="primary" onClick={onAcceptPreview}>
                接受预览
              </Button>
              <Button size="small" onClick={onCancelPreview}>
                取消预览
              </Button>
            </Space>
          }
        />
      )}
    </div>
  );
}
