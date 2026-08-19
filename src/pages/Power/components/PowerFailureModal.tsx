import {
  Alert,
  Descriptions,
  List,
  Modal,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { PowerFailureSimulation, PowerNode } from '@/services/idc/power';

interface Props {
  simulation?: PowerFailureSimulation;
  nodes: PowerNode[];
  loading: boolean;
  onClose: () => void;
}

export const PowerFailureModal = ({
  simulation,
  nodes,
  loading,
  onClose,
}: Props) => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <Modal
      open={Boolean(simulation) || loading}
      width={720}
      title="单点故障影响预演（只读）"
      footer={null}
      onCancel={onClose}
    >
      {loading ? (
        <Typography.Text>正在计算冗余切换与负载影响…</Typography.Text>
      ) : (
        simulation && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={
                simulation.severity === 'high'
                  ? 'error'
                  : simulation.severity === 'medium'
                    ? 'warning'
                    : 'success'
              }
              showIcon
              message={`${simulation.failedNodeName} 故障模拟：${simulation.severity === 'high' ? '高风险' : simulation.severity === 'medium' ? '需关注' : '低风险'}`}
              description={simulation.explanation}
            />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="影响设备">
                {simulation.affectedDeviceIds.length} 台
              </Descriptions.Item>
              <Descriptions.Item label="影响负载">
                {simulation.impactedLoad} W
              </Descriptions.Item>
              <Descriptions.Item label="自动切换">
                {simulation.transferredDeviceIds.length} 台
              </Descriptions.Item>
              <Descriptions.Item label="预计离线">
                {simulation.offlineDeviceIds.length} 台
              </Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Text>A 路故障后预测负载</Typography.Text>
              <Progress
                percent={Math.round((simulation.predictedPathA / 30000) * 100)}
                format={() => `${simulation.predictedPathA} W`}
              />
              <Typography.Text>B 路故障后预测负载</Typography.Text>
              <Progress
                status={
                  simulation.predictedPathB > 24000 ? 'exception' : 'normal'
                }
                percent={Math.round((simulation.predictedPathB / 30000) * 100)}
                format={() => `${simulation.predictedPathB} W`}
              />
            </div>
            {simulation.overloadedNodeIds.length > 0 && (
              <Alert
                type="warning"
                message="切换后可能过载"
                description={simulation.overloadedNodeIds
                  .map((id) => byId.get(id)?.name || id)
                  .join('、')}
              />
            )}
            <List
              size="small"
              bordered
              header="受影响设备"
              dataSource={simulation.affectedDeviceIds}
              renderItem={(id) => (
                <List.Item
                  extra={
                    <Tag
                      color={
                        simulation.offlineDeviceIds.includes(id)
                          ? 'error'
                          : 'success'
                      }
                    >
                      {simulation.offlineDeviceIds.includes(id)
                        ? '预计离线'
                        : '自动切换'}
                    </Tag>
                  }
                >
                  {byId.get(id)?.name || id}
                </List.Item>
              )}
            />
          </Space>
        )
      )}
    </Modal>
  );
};
