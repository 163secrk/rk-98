import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Descriptions,
  Badge,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  InboxOutlined,
  FileTextOutlined,
  WarningOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { consumablesApi, storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

const typeMap = {
  recyclable: { text: '可回收', color: '#1677ff' },
  non_recyclable: { text: '不可回收', color: '#fa8c16' },
};

const recordTypeMap = {
  inbound: { text: '入库', color: 'green' },
  consume: { text: '消耗', color: 'red' },
  return: { text: '归还', color: 'blue' },
  adjust: { text: '调整', color: 'default' },
};

function Consumables() {
  const [list, setList] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStoreId, setFilterStoreId] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inboundOpen, setInboundOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [inboundForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit = isAdmin || isManager;

  useEffect(() => {
    loadData();
    loadAlerts();
  }, [keyword, filterType, filterStoreId]);

  useEffect(() => {
    if (activeTab === 'records') {
      loadRecords();
    }
    if (activeTab === 'alerts') {
      loadAlerts();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, storeList] = await Promise.all([
        consumablesApi.list({ keyword, type: filterType, storeId: filterStoreId }),
        storesApi.list(),
      ]);
      setList(data);
      setStores(storeList);
    } catch (err) {
      message.error('加载耗材列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    consumablesApi.getLowStockAlerts({ storeId: filterStoreId || undefined }).then((data) => {
      setAlerts(data);
      setLoading(false);
    }).catch(() => {
      message.error('加载库存预警失败');
      setLoading(false);
    });
  };

  const loadRecords = async () => {
    setRecordsLoading(true);
    consumablesApi.getRecords({ storeId: filterStoreId || undefined }).then((data) => {
      setRecords(data);
      setRecordsLoading(false);
    }).catch(() => {
      message.error('加载操作记录失败');
      setRecordsLoading(false);
    });
  };

  const handleSearch = () => {
    loadData();
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await consumablesApi.create(values);
      message.success('创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      loadData();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '创建失败');
    }
  };

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await consumablesApi.update(editingItem.id, values);
      message.success('更新成功');
      setEditOpen(false);
      loadData();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '更新失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await consumablesApi.remove(id);
      message.success('已停用');
      loadData();
    } catch (err) {
      message.error(err.message || '操作失败');
    }
  };

  const handleInbound = async () => {
    try {
      const values = await inboundForm.validateFields();
      await consumablesApi.inbound(currentItem.id, values);
      message.success('入库成功');
      setInboundOpen(false);
      inboundForm.resetFields();
      loadData();
      if (activeTab === 'records') loadRecords();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '入库失败');
    }
  };

  const handleConsume = async () => {
    try {
      const values = await consumeForm.validateFields();
      await consumablesApi.consume(currentItem.id, values);
      message.success('出库成功');
      setConsumeOpen(false);
      consumeForm.resetFields();
      loadData();
      if (activeTab === 'records') loadRecords();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '出库失败');
    }
  };

  const handleAdjust = async () => {
    try {
      const values = await adjustForm.validateFields();
      await consumablesApi.adjust(currentItem.id, values);
      message.success('调整成功');
      setAdjustOpen(false);
      adjustForm.resetFields();
      loadData();
      if (activeTab === 'records') loadRecords();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '调整失败');
    }
  };

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      type: 'non_recyclable',
      stock: 0,
      threshold: 0,
      unitPrice: 0,
      storeId: stores[0]?.id,
      status: 'active',
    });
    setCreateOpen(true);
  };

  const openEdit = (record) => {
    setEditingItem(record);
    editForm.setFieldsValue({
      name: record.name,
      type: record.type,
      unit: record.unit,
      threshold: Number(record.threshold),
      unitPrice: Number(record.unitPrice),
      specification: record.specification,
      status: record.status,
      remark: record.remark,
    });
    setEditOpen(true);
  };

  const openInbound = (record) => {
    setCurrentItem(record);
    inboundForm.resetFields();
    setInboundOpen(true);
  };

  const openConsume = (record) => {
    setCurrentItem(record);
    consumeForm.resetFields();
    setConsumeOpen(true);
  };

  const openAdjust = (record) => {
    setCurrentItem(record);
    adjustForm.setFieldsValue({ stock: Number(record.stock) });
    setAdjustOpen(true);
  };

  const columns = [
    {
      title: '耗材名称',
      dataIndex: 'name',
      width: 140,
    },
    {
      title: '门店',
      dataIndex: 'store',
      width: 100,
      render: (_, r) => r.store?.name || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v) => {
        const t = typeMap[v] || typeMap.non_recyclable;
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '规格',
      dataIndex: 'specification',
      width: 120,
      render: (v) => v || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 60,
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      width: 110,
      render: (v, r) => {
        const low = Number(r.stock) <= Number(r.threshold) && Number(r.threshold) > 0;
        return (
          <Space>
            <span style={{ fontWeight: 'bold', color: low ? '#f5222d' : '#1677ff' }}>
              {Number(v).toFixed(2)}{r.unit}
            </span>
            {low && <Badge status="error" />}
          </Space>
        );
      },
    },
    {
      title: '预警阈值',
      dataIndex: 'threshold',
      width: 100,
      render: (v, r) => `${Number(v).toFixed(2)}${r.unit}`,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      width: 100,
      render: (v) => <span style={{ color: '#f5222d' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => (v === 'active' ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    canEdit && {
      title: '操作',
      width: 260,
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<ImportOutlined />} onClick={() => openInbound(r)} disabled={r.status !== 'active'}>
            入库
          </Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => openConsume(r)} disabled={r.status !== 'active'}>
            出库
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => openAdjust(r)}>
            调整
          </Button>
          {isAdmin && r.status === 'active' && (
            <Popconfirm title="确定停用该耗材？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                停用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ].filter(Boolean);

  const alertColumns = [
    { title: '耗材名称', dataIndex: 'name', width: 140 },
    { title: '门店', width: 100, render: (_, r) => r.store?.name || '-' },
    { title: '类型', dataIndex: 'type', width: 100, render: (v) => { const t = typeMap[v]; return <Tag color={t.color}>{t.text}</Tag>; } },
    { title: '当前库存', dataIndex: 'stock', width: 120, render: (v, r) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{Number(v).toFixed(2)}{r.unit}</span> },
    { title: '预警阈值', dataIndex: 'threshold', width: 120, render: (v, r) => `${Number(v).toFixed(2)}${r.unit}` },
    {
      title: '操作',
      width: 120,
      render: (_, r) => (
        <Button type="link" size="small" icon={<ImportOutlined />} onClick={() => openInbound(r)}>立即入库</Button>
      ),
    },
  ];

  const recordColumns = [
    { title: '时间', dataIndex: 'createdAt', width: 170, render: (v) => new Date(v).toLocaleString() },
    { title: '耗材', dataIndex: 'consumable', width: 120, render: (_, r) => r.consumable?.name || '-' },
    { title: '类型', dataIndex: 'recordType', width: 80, render: (v) => { const t = recordTypeMap[v]; return t ? <Tag color={t.color}>{t.text}</Tag> : v; } },
    { title: '数量', dataIndex: 'quantity', width: 100, render: (v, r) => `${Number(v).toFixed(2)}${r.consumable?.unit || ''}` },
    { title: '变动后库存', dataIndex: 'stockAfter', width: 110, render: (v, r) => `${Number(v).toFixed(2)}${r.consumable?.unit || ''}` },
    { title: '关联订单', dataIndex: 'order', width: 150, render: (_, r) => r.order ? (
      <Tooltip title={`客户: ${r.order.customerName || '-'}`}>
        <Tag color="purple" style={{ cursor: 'pointer' }}>{r.order.orderNo}</Tag>
      </Tooltip>
    ) : '-' },
    { title: '操作人', dataIndex: 'operator', width: 100, render: (_, r) => r.operator?.realName || '-' },
    { title: '批次号', dataIndex: 'batchNo', width: 100, render: (v) => v || '-' },
    { title: '备注', dataIndex: 'remark', render: (v) => v || '-' },
  ];

  const totalStock = list.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const totalValue = list.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.unitPrice || 0), 0);
  const lowStockCount = alerts.length;
  const totalTypes = list.length;

  const tabItems = [
    {
      key: 'list',
      label: '耗材列表',
      icon: <InboxOutlined />,
      children: (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="耗材种类" value={totalTypes} valueStyle={{ color: '#1677ff' }} />
              </Col>
              <Col span={6}>
                <Statistic title="库存总价值" value={totalValue.toFixed(2)} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="低库存预警" value={lowStockCount} valueStyle={{ color: lowStockCount > 0 ? '#f5222d' : '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="总库存(件)" value={totalStock.toFixed(2)} />
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Input
                placeholder="搜索耗材名称"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="类型"
                value={filterType || undefined}
                onChange={(v) => setFilterType(v || '')}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="recyclable">可回收</Select.Option>
                <Select.Option value="non_recyclable">不可回收</Select.Option>
              </Select>
              <Select
                placeholder="门店"
                value={filterStoreId || undefined}
                onChange={(v) => setFilterStoreId(v || '')}
                style={{ width: 150 }}
                allowClear
              >
                {stores.map((s) => (
                  <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
              </Select>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增耗材
              </Button>
            )}
          </div>

          <Table
            dataSource={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 种耗材` }}
            scroll={{ x: 1300 }}
          />
        </>
      ),
    },
    {
      key: 'alerts',
      label: (
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          库存预警
          {alerts.length > 0 && <Badge count={alerts.length} />}
        </Space>
      ),
      children: (
        <>
          {alerts.length === 0 ? (
            <Alert message="暂无低库存耗材" type="success" showIcon />
          ) : (
            <Table
              dataSource={alerts}
              columns={alertColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          )}
        </>
      ),
    },
    {
      key: 'records',
      label: <Space><HistoryOutlined />操作记录</Space>,
      icon: <FileTextOutlined />,
      children: (
        <Table
          dataSource={records}
          columns={recordColumns}
          rowKey="id"
          loading={recordsLoading}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条记录` }}
          scroll={{ x: 1200 }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>耗材管理</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title="新增耗材"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="创建"
        destroyOnClose
        width={560}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="storeId" label="所属门店" rules={[{ required: true, message: '请选择门店' }]}>
          <Select placeholder="选择门店">
            {stores.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
          <Form.Item name="name" label="耗材名称" rules={[{ required: true, message: '请输入耗材名称' }]}>
            <Input placeholder="如：洗衣液" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="耗材类型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="recyclable">可回收</Select.Option>
                  <Select.Option value="non_recyclable">不可回收</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="计量单位" rules={[{ required: true, message: '请输入单位' }]}>
                <Input placeholder="如：L、个、瓶" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stock" label="初始库存">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="threshold" label="预警阈值">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unitPrice" label="单价(元)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="specification" label="规格">
            <Input placeholder="如：5L/桶" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑耗材"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEdit}
        okText="保存"
        destroyOnClose
        width={560}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="耗材名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="耗材类型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="recyclable">可回收</Select.Option>
                  <Select.Option value="non_recyclable">不可回收</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="计量单位" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="threshold" label="预警阈值">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitPrice" label="单价(元)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="specification" label="规格">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`入库 - ${currentItem?.name || ''}`}
        open={inboundOpen}
        onCancel={() => setInboundOpen(false)}
        onOk={handleInbound}
        okText="确认入库"
        destroyOnClose
      >
        {currentItem && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前库存">{Number(currentItem.stock).toFixed(2)}{currentItem.unit}</Descriptions.Item>
              <Descriptions.Item label="预警阈值">{Number(currentItem.threshold).toFixed(2)}{currentItem.unit}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
        <Form form={inboundForm} layout="vertical">
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} addonAfter={currentItem?.unit || ''} placeholder="输入入库数量" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="batchNo" label="批次号">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitCost" label="单价成本(元)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`出库 - ${currentItem?.name || ''}`}
        open={consumeOpen}
        onCancel={() => setConsumeOpen(false)}
        onOk={handleConsume}
        okText="确认出库"
        destroyOnClose
      >
        {currentItem && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前库存">
                <span style={{ color: Number(currentItem.stock) > 0 ? '#1677ff' : '#f5222d', fontWeight: 'bold' }}>
                  {Number(currentItem.stock).toFixed(2)}{currentItem.unit}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
        <Form form={consumeForm} layout="vertical">
          <Form.Item name="quantity" label="出库数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} addonAfter={currentItem?.unit || ''} placeholder="输入出库数量" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="如：洗涤XX订单使用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`库存调整 - ${currentItem?.name || ''}`}
        open={adjustOpen}
        onCancel={() => setAdjustOpen(false)}
        onOk={handleAdjust}
        okText="确认调整"
        destroyOnClose
      >
        {currentItem && (
          <Alert
            message="调整后库存"
            description={`当前库存：${Number(currentItem.stock).toFixed(2)}${currentItem.unit}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="stock" label="调整后库存" rules={[{ required: true, message: '请输入库存' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} addonAfter={currentItem?.unit || ''} />
          </Form.Item>
          <Form.Item name="remark" label="调整原因">
            <Input placeholder="如：盘点差异" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Consumables;
