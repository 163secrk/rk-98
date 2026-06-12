import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Modal,
  Card,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ordersApi, storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

const { RangePicker } = DatePicker;

function OrderList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    storeId: undefined,
    dateRange: null,
  });
  const { user } = useAuthStore();

  useEffect(() => {
    loadList();
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await storesApi.list();
      setStores(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.status) params.status = filters.status;
      if (filters.storeId) params.storeId = filters.storeId;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (user?.role === 'staff' && user?.storeId) {
        params.storeId = user.storeId;
      }
      const res = await ordersApi.list(params);
      setList(res);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    received: { text: '已收件', color: 'blue' },
    washing: { text: '洗涤中', color: 'purple' },
    ready: { text: '待取件', color: 'orange' },
    delivered: { text: '已取件', color: 'green' },
    cancelled: { text: '已取消', color: 'default' },
  };

  const nextStatusMap = {
    received: 'washing',
    washing: 'ready',
    ready: 'delivered',
  };
  const nextStatusText = {
    received: '开始洗涤',
    washing: '洗涤完成',
    ready: '确认取件',
  };

  const handleChangeStatus = async (record) => {
    const nextStatus = nextStatusMap[record.status];
    if (!nextStatus) return;
    Modal.confirm({
      title: '确认操作',
      content: `确定将订单状态更新为「${statusMap[nextStatus].text}」吗？`,
      onOk: async () => {
        try {
          await ordersApi.updateStatus(record.id, { status: nextStatus });
          message.success('状态更新成功');
          loadList();
        } catch (err) {
          message.error(err.message || '更新失败');
        }
      },
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await ordersApi.get(record.id);
      setDetail(res);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message || '获取详情失败');
    }
  };

  const handleViewVoucher = (id) => {
    navigate(`/orders/voucher/${id}`);
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: '客户姓名', dataIndex: 'customerName' },
    { title: '联系电话', dataIndex: 'customerPhone' },
    { title: '门店', dataIndex: ['store', 'name'], render: (v) => v || '-' },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      render: (v) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '已付',
      dataIndex: 'paidAmount',
      render: (v) => <span style={{ color: '#52c41a' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleViewVoucher(record.id)}>
            凭证
          </Button>
          {nextStatusMap[record.status] && (
            <Button type="link" size="small" onClick={() => handleChangeStatus(record)}>
              {nextStatusText[record.status]}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索订单号/客户/手机号"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              placeholder="订单状态"
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              style={{ width: 140 }}
              allowClear
            >
              {Object.entries(statusMap).map(([k, v]) => (
                <Select.Option key={k} value={k}>
                  {v.text}
                </Select.Option>
              ))}
            </Select>
            {(!user?.storeId || user?.role === 'admin') && (
              <Select
                placeholder="门店"
                value={filters.storeId}
                onChange={(v) => setFilters({ ...filters, storeId: v })}
                style={{ width: 180 }}
                allowClear
              >
                {stores.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            )}
            <RangePicker
              value={filters.dateRange}
              onChange={(v) => setFilters({ ...filters, dateRange: v })}
            />
            <Button icon={<ReloadOutlined />} onClick={loadList}>
              查询
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/create')}>
              录入收件单
            </Button>
          </Space>
        </Card>
      </div>
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="voucher" type="primary" onClick={() => { setDetailOpen(false); handleViewVoucher(detail.id); }}>
            查看凭证
          </Button>,
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {detail && (
          <div>
            <p><strong>订单号：</strong>{detail.orderNo}</p>
            <p><strong>客户：</strong>{detail.customerName}（{detail.customerPhone}）</p>
            <p><strong>门店：</strong>{detail.store?.name}</p>
            <p><strong>收件员工：</strong>{detail.staff?.realName}</p>
            <p><strong>状态：</strong>{statusMap[detail.status]?.text}</p>
            <p><strong>备注：</strong>{detail.remark || '无'}</p>
            <p><strong>创建时间：</strong>{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            <h4 style={{ marginTop: 16 }}>衣物明细</h4>
            <Table
              size="small"
              dataSource={detail.items}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '衣物', dataIndex: 'clothingName' },
                { title: '数量', dataIndex: 'quantity', width: 80 },
                { title: '单价', dataIndex: 'unitPrice', render: (v) => `¥${Number(v).toFixed(2)}` },
                { title: '小计', dataIndex: 'subtotal', render: (v) => `¥${Number(v).toFixed(2)}` },
              ]}
            />
            <div style={{ marginTop: 12, textAlign: 'right', fontSize: 16, fontWeight: 'bold' }}>
              总计：¥{Number(detail.totalAmount).toFixed(2)}
              <span style={{ color: '#52c41a', marginLeft: 16 }}>已付：¥{Number(detail.paidAmount).toFixed(2)}</span>
              <span style={{ color: '#f5222d', marginLeft: 16 }}>
                待付：¥{(Number(detail.totalAmount) - Number(detail.paidAmount)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OrderList;
