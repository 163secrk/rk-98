import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Table,
  DatePicker,
  Space,
  Row,
  Col,
  message,
  Divider,
  Statistic,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clothingApi, ordersApi, storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function CreateOrder() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [clothingTypes, setClothingTypes] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([clothingApi.active(), storesApi.list()]);
      setClothingTypes(c);
      setStores(s.filter((st) => st.status === 'active'));
      if (user?.storeId) {
        form.setFieldsValue({ storeId: user.storeId });
      }
      addItem();
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    const defaultType = clothingTypes[0];
    setItems([
      ...items,
      {
        id: Date.now() + Math.random(),
        clothingTypeId: defaultType?.id,
        clothingName: defaultType?.name,
        unitPrice: defaultType?.price || 0,
        quantity: 1,
        remark: '',
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length <= 1) {
      message.warning('至少保留一件衣物');
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        if (field === 'clothingTypeId') {
          const ct = clothingTypes.find((c) => c.id === value);
          if (ct) {
            updated.clothingName = ct.name;
            updated.unitPrice = ct.price;
          }
        }
        return updated;
      })
    );
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + Number(i.unitPrice) * Number(i.quantity),
    0
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning('请添加衣物');
        return;
      }
      setSubmitting(true);
      const payload = {
        ...values,
        items: items.map((i) => ({
          clothingTypeId: i.clothingTypeId,
          clothingName: i.clothingName,
          unitPrice: Number(i.unitPrice),
          quantity: Number(i.quantity),
          remark: i.remark,
        })),
      };
      const res = await ordersApi.create(payload);
      message.success('收件单创建成功');
      navigate(`/orders/voucher/${res.id}`);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    {
      title: '衣物类型',
      dataIndex: 'clothingTypeId',
      width: 200,
      render: (_, record) => (
        <Select
          value={record.clothingTypeId}
          onChange={(v) => updateItem(record.id, 'clothingTypeId', v)}
          style={{ width: '100%' }}
        >
          {clothingTypes.map((c) => (
            <Select.Option key={c.id} value={c.id}>
              {c.name}（¥{Number(c.price).toFixed(2)}）
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '单价(元)',
      dataIndex: 'unitPrice',
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(v) => updateItem(record.id, 'unitPrice', v)}
          style={{ width: '100%' }}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_, record) => (
        <InputNumber
          value={record.quantity}
          onChange={(v) => updateItem(record.id, 'quantity', v)}
          style={{ width: '100%' }}
          min={1}
        />
      ),
    },
    {
      title: '小计',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
          ¥{(Number(record.unitPrice) * Number(record.quantity)).toFixed(2)}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      render: (_, record) => (
        <Input
          value={record.remark}
          onChange={(e) => updateItem(record.id, 'remark', e.target.value)}
          placeholder="如：颜色、瑕疵等"
        />
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => removeItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>录入收件单</h2>
      </div>

      <Form form={form} layout="vertical">
        <Card title="客户信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="customerName"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="customerPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="customerAddress" label="地址">
                <Input placeholder="请输入地址（可选）" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="门店信息" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="storeId"
                label="收件门店"
                rules={[{ required: true, message: '请选择门店' }]}
              >
                <Select placeholder="请选择门店">
                  {stores.map((s) => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="pickupDate" label="预计取件日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="paidAmount" label="已收款金额（元）">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="订单备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息（可选）" />
          </Form.Item>
        </Card>

        <Card
          title="衣物明细"
          style={{ marginBottom: 16 }}
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              添加衣物
            </Button>
          }
        >
          <Table
            columns={itemColumns}
            dataSource={items}
            rowKey="id"
            pagination={false}
            bordered
          />
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#666' }}>共 {items.length} 件衣物</div>
            <Statistic
              title="应收总金额"
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontSize: 28 }}
            />
          </div>
        </Card>

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button size="large" onClick={() => navigate('/orders')}>
              取消
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
            >
              提交并生成取票凭证
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}

export default CreateOrder;
