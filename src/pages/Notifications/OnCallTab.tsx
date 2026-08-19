import { Button, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { EntityStatus } from '@/components/operations';
import type { OnCallShift } from '@/services/platform';

interface OnCallTabProps {
  shifts: OnCallShift[];
  responders: string[];
  onHandoff: (shiftId: string, responder: string) => Promise<void>;
}

export function OnCallTab({ shifts, responders, onHandoff }: OnCallTabProps) {
  const active = shifts.find((shift) => shift.status === 'active');
  const [handoffTo, setHandoffTo] = useState<string>();
  return (
    <>
      {active && (
        <Space wrap style={{ marginBottom: 16 }}>
          <Tag color="processing">当前主值：{active.primary}</Tag>
          <span>备值：{active.backup}</span>
          <Select
            placeholder="选择临时接班人"
            value={handoffTo}
            onChange={setHandoffTo}
            style={{ width: 180 }}
            options={responders
              .filter((name) => name !== active.primary)
              .map((value) => ({ value, label: value }))}
          />
          <Button
            type="primary"
            disabled={!handoffTo}
            onClick={() =>
              handoffTo &&
              void onHandoff(active.id, handoffTo).then(() =>
                setHandoffTo(undefined),
              )
            }
          >
            确认临时交接
          </Button>
        </Space>
      )}
      <Table
        rowKey="id"
        dataSource={shifts}
        pagination={false}
        columns={[
          {
            title: '班次',
            render: (_, shift) =>
              `${dayjs(shift.startsAt).format('MM-DD HH:mm')} - ${dayjs(shift.endsAt).format('HH:mm')}`,
          },
          { title: '主值', dataIndex: 'primary' },
          { title: '备值', dataIndex: 'backup' },
          {
            title: '状态',
            render: (_, shift) => (
              <EntityStatus
                status={shift.status}
                label={
                  shift.status === 'active'
                    ? '当前班次'
                    : shift.status === 'upcoming'
                      ? '待接班'
                      : '已结束'
                }
              />
            ),
          },
        ]}
      />
    </>
  );
}
