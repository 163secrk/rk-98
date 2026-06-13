import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  InputNumber,
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
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ordersApi, storesApi, consumablesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

const { RangePicker } = DatePicker;

function OrderList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [consumableModalOpen, setConsumableModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recommendedConsumables, setRecommendedConsumables] = useState([]);
  const [allConsumables, setAllConsumables] = useState([]);
  const [selectedConsumables, setSelectedConsumables] = useState([]);
  const [consumableLoading, setConsumableLoading] = useState(false);
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

    if (nextStatus === 'washing') {
      setSelectedOrder(record);
      setConsumableLoading(true);
      try {
        const totalItems = record.items.reduce((sum, item) => sum + item.quantity, 0);
        const storeId = record.storeId || user?.storeId;
        const [recommended, allConsumableList] = await Promise.all([
          consumablesApi.getRecommendedForWash({ storeId, totalItems }),
          consumablesApi.list({ storeId }),
        ]);
        setRecommendedConsumables(recommended);
        setAllConsumables(allConsumableList.filter(c => c.status === 'active'));
        setSelectedConsumables(
          recommended
            .filter(item => item.recommendedQuantity > 0)
            .map(item => ({
              ...item,
              quantity: item.recommendedQuantity,
            }))
        );
        setConsumableModalOpen(true);
      } catch (err) {
        message.error(err.message || '获取耗材列表失败');
      } finally {
        setConsumableLoading(false);
      }
      return;
    }

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

  const handleConsumableQuantityChange = (index, value) => {
    const newSelected = [...selectedConsumables];
    newSelected[index] = {
      ...newSelected[index],
      quantity: Math.max(0, Number(value) || 0),
    };
    setSelectedConsumables(newSelected);
  };

  const handleRemoveConsumable = (index) => {
    setSelectedConsumables(selectedConsumables.filter((_, i) => i !== index));
  };

  const handleAddConsumable = (consumableId) => {
    const recommendedItem = recommendedConsumables.find(c => c.consumableId === consumableId);
    if (recommendedItem) {
      if (selectedConsumables.some(c => c.consumableId === consumableId)) return;
      setSelectedConsumables([...selectedConsumables, { ...recommendedItem, quantity: 0 }]);
      return;
    }

    const allItem = allConsumables.find(c => c.id === consumableId);
    if (!allItem) return;
    if (selectedConsumables.some(c => c.consumableId === consumableId)) return;
    setSelectedConsumables([
      ...selectedConsumables,
      {
        consumableId: allItem.id,
        consumableName: allItem.name,
        unit: allItem.unit,
        stock: allItem.stock,
        recommendedQuantity: 0,
        type: allItem.type,
        quantity: 0,
      },
    ]);
  };

  const availableConsumablesToAdd = allConsumables.filter(
    c => !selectedConsumables.some(s => s.consumableId === c.id)
  );

  const handleConfirmWashing = async () => {
    if (!selectedOrder) return;

    const validConsumables = selectedConsumables.filter(c => c.quantity > 0);
    if (validConsumables.length === 0) {
      message.error('请至少选择一种耗材并填写用量');
      return;
    }

    for (const c of validConsumables) {
      if (c.quantity > c.stock) {
        message.error(`耗材「${c.consumableName}」用量超过库存（当前库存：${c.stock}${c.unit}）`);
        return;
      }
    }

    setConsumableLoading(true);
    try {
      await ordersApi.updateStatus(selectedOrder.id, {
        status: 'washing',
        consumables: validConsumables.map(c => ({
          consumableId: c.consumableId,
          consumableName: c.consumableName,
          quantity: c.quantity,
          unit: c.unit,
        })),
      });
      message.success('开始洗涤成功，耗材已出库');
      setConsumableModalOpen(false);
      loadList();
    } catch (err) {
      message.error(err.message || '开始洗涤失败');
    } finally {
      setConsumableLoading(false);
    }
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
        width={700}
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
            {detail.consumableRecords && detail.consumableRecords.length > 0 && (
              <>
                <h4 style={{ marginTop: 20, marginBottom: 12 }}>耗材消耗明细</h4>
                {(() => {
                  const consumeRecords = detail.consumableRecords.filter(r => r.recordType === 'consume');
                  const returnRecords = detail.consumableRecords.filter(r => r.recordType === 'return');

                  const consumeSummary = consumeRecords.reduce((acc, r) => {
                    const name = r.consumable?.name || r.consumableName;
                    const unit = r.consumable?.unit || '';
                    if (!acc[name]) {
                      acc[name] = { name, unit, total: 0 };
                    }
                    acc[name].total += Number(r.quantity);
                    return acc;
                  }, {});

                  const returnSummary = returnRecords.reduce((acc, r) => {
                    const name = r.consumable?.name || r.consumableName;
                    const unit = r.consumable?.unit || '';
                    if (!acc[name]) {
                      acc[name] = { name, unit, total: 0 };
                    }
                    acc[name].total += Number(r.quantity);
                    return acc;
                  }, {});

                  const netConsume = {};
                  Object.keys(consumeSummary).forEach(name => {
                    netConsume[name] = {
                      name,
                      unit: consumeSummary[name].unit,
                      consume: consumeSummary[name].total,
                      return: returnSummary[name]?.total || 0,
                      net: consumeSummary[name].total - (returnSummary[name]?.total || 0),
                    };
                  });

                  const typeMap = {
                    inbound: { text: '入库', color: 'green' },
                    consume: { text: '出库', color: 'red' },
                    return: { text: '归还', color: 'blue' },
                    adjust: { text: '调整', color: 'orange' },
                  };

                  return (
                    <>
                      <Card size="small" style={{ marginBottom: 12 }} title="耗材消耗汇总">
                        <Table
                          size="small"
                          dataSource={Object.values(netConsume)}
                          rowKey="name"
                          pagination={false}
                          columns={[
                            { title: '耗材名称', dataIndex: 'name' },
                            { title: '单位', dataIndex: 'unit', width: 60 },
                            {
                              title: '出库量',
                              dataIndex: 'consume',
                              width: 80,
                              render: (v, r) => <span style={{ color: '#f5222d' }}>{v}{r.unit}</span>,
                            },
                            {
                              title: '归还量',
                              dataIndex: 'return',
                              width: 80,
                              render: (v, r) => <span style={{ color: '#1890ff' }}>{v}{r.unit}</span>,
                            },
                            {
                              title: '实际消耗',
                              dataIndex: 'net',
                              width: 90,
                              render: (v, r) => (
                                <span style={{ fontWeight: 'bold', color: v > 0 ? '#f5222d' : '#52c41a' }}>
                                  {v}{r.unit}
                                </span>
                              ),
                            },
                          ]}
                        />
                      </Card>
                      <Table
                        size="small"
                        dataSource={detail.consumableRecords}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: '耗材名称', dataIndex: ['consumable', 'name'], render: (v, r) => v || r.consumableName },
                          {
                            title: '操作类型',
                            dataIndex: 'recordType',
                            width: 80,
                            render: (v) => {
                              const info = typeMap[v] || { text: v, color: 'default' };
                              return <Tag color={info.color}>{info.text}</Tag>;
                            },
                          },
                          { title: '数量', dataIndex: 'quantity', width: 80, render: (v, r) => `${v}${r.consumable?.unit || ''}` },
                          { title: '操作后库存', dataIndex: 'stockAfter', width: 100, render: (v, r) => `${v}${r.consumable?.unit || ''}` },
                          { title: '操作员', dataIndex: ['operator', 'realName'], width: 80, render: (v) => v || '-' },
                          { title: '操作时间', dataIndex: 'createdAt', width: 130, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
                        ]}
                      />
                    </>
                  );
                })()}
              </>
            )}
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

      <Modal
        title="选择洗涤耗材"
        open={consumableModalOpen}
        onCancel={() => setConsumableModalOpen(false)}
        width={750}
        confirmLoading={consumableLoading}
        onOk={handleConfirmWashing}
        okText="确认开始洗涤"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', margin: '0 0 8px 0' }}>
            订单号：<span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedOrder?.orderNo}</span>
          </p>
          <p style={{ color: '#666', margin: '0 0 12px 0' }}>
            系统已根据衣物数量推荐耗材用量，您可以调整实际用量，或添加其他耗材：
          </p>
          <div style={{ marginBottom: 12 }}>
            <Select
              placeholder="添加其他耗材..."
              style={{ width: 240 }}
              value={undefined}
              onChange={handleAddConsumable}
              showSearch
              optionFilterProp="children"
              disabled={availableConsumablesToAdd.length === 0}
            >
              {availableConsumablesToAdd.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}（库存：{c.stock}{c.unit}）
                </Select.Option>
              ))}
            </Select>
            {availableConsumablesToAdd.length === 0 && (
              <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>已添加全部耗材</span>
            )}
          </div>
        </div>
        <Table
          size="small"
          dataSource={selectedConsumables}
          rowKey="consumableId"
          pagination={false}
          columns={[
            { title: '耗材名称', dataIndex: 'consumableName' },
            { title: '类型', dataIndex: 'type', width: 80, render: (v) => v === 'recyclable' ? '可回收' : '一次性' },
            { title: '单位', dataIndex: 'unit', width: 60 },
            { title: '当前库存', dataIndex: 'stock', width: 90, render: (v, r) => `${v}${r.unit}` },
            { title: '推荐用量', dataIndex: 'recommendedQuantity', width: 90, render: (v, r) => v > 0 ? `${v}${r.unit}` : '-' },
            {
              title: '实际用量',
              dataIndex: 'quantity',
              width: 150,
              render: (v, record, index) => (
                <InputNumber
                  min={0}
                  step={0.01}
                  value={v}
                  onChange={(value) => handleConsumableQuantityChange(index, value)}
                  style={{ width: '100%' }}
                  addonAfter={record.unit}
                />
              ),
            },
            {
              title: '操作',
              width: 60,
              render: (_, record, index) => (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveConsumable(index)}
                />
              ),
            },
          ]}
        />
        <div style={{ marginTop: 12, color: '#faad14', fontSize: 12 }}>
          <p style={{ margin: 0 }}>提示：</p>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>请确认实际耗材用量后再开始洗涤</li>
            <li>用量为0的耗材不会执行出库操作</li>
            <li>可回收耗材（如衣架、洗衣袋）会在订单完成时自动归还入库</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}

export default OrderList;
