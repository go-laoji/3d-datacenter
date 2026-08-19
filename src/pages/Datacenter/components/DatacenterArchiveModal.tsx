import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Modal,
  message,
  Spin,
} from 'antd';
import { useEffect, useState } from 'react';
import {
  archiveDatacenter,
  getDatacenterArchiveImpact,
} from '@/services/idc/datacenter';

interface DatacenterArchiveModalProps {
  datacenter?: IDC.Datacenter;
  open: boolean;
  onCancel: () => void;
  onArchived: () => void;
}

const DatacenterArchiveModal: React.FC<DatacenterArchiveModalProps> = ({
  datacenter,
  open,
  onCancel,
  onArchived,
}) => {
  const [impact, setImpact] = useState<IDC.DatacenterDependencyImpact>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open || !datacenter) return;
    setConfirmed(false);
    setImpact(undefined);
    setLoading(true);
    getDatacenterArchiveImpact(datacenter.id)
      .then((response) => {
        if (response.success) setImpact(response.data);
      })
      .finally(() => setLoading(false));
  }, [datacenter, open]);

  const handleArchive = async () => {
    if (!datacenter || !confirmed) return;
    setSubmitting(true);
    try {
      const response = await archiveDatacenter(datacenter.id);
      if (!response.success) return;
      message.success('数据中心已归档，资产和历史关系已保留');
      onArchived();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="归档数据中心"
      open={open}
      onCancel={onCancel}
      width={620}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="archive"
          danger
          type="primary"
          disabled={!impact || !confirmed}
          loading={submitting}
          onClick={handleArchive}
        >
          确认归档
        </Button>,
      ]}
    >
      <Alert
        type="warning"
        showIcon
        message={`即将归档：${datacenter?.name || '-'}`}
        description="归档后站点停止承载新操作，但机柜、设备、告警、布局和连接历史都会保留。"
        style={{ marginBottom: 16 }}
      />
      <Spin spinning={loading}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="机柜">
            {impact?.cabinetCount ?? '-'} 个
          </Descriptions.Item>
          <Descriptions.Item label="设备">
            {impact?.deviceCount ?? '-'} 台
          </Descriptions.Item>
          <Descriptions.Item label="活动告警">
            {impact?.activeAlertCount ?? '-'} 条
          </Descriptions.Item>
          <Descriptions.Item label="布局草稿">
            {impact?.layoutCount ?? '-'} 份
          </Descriptions.Item>
          <Descriptions.Item label="网络连接" span={2}>
            {impact?.connectionCount ?? '-'} 条
          </Descriptions.Item>
        </Descriptions>
      </Spin>
      <Checkbox
        checked={confirmed}
        onChange={(event) => setConfirmed(event.target.checked)}
        style={{ marginTop: 16 }}
      >
        我已确认以上依赖，归档后不再允许在该站点新增资源
      </Checkbox>
    </Modal>
  );
};

export default DatacenterArchiveModal;
