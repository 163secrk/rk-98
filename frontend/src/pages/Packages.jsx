import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { packagesApi, clothingApi } from '../services/api';

function Packages() {
  const [packages, setPackages] = useState([]);
  const [clothingTypes, setClothingTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgs, ct] = await Promise.all([packagesApi.list(), clothingApi.list()]);
      setPackages(pkgs);
      setClothingTypes(ct);
    } catch (err) {
      message.error('加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPkg(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', validDays: 365 });
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setEditingPkg(pkg);
    form.setFieldsValue({
      name: pkg.name,
      clothingTypeId: pkg.clothingTypeId,
      totalCount: pkg.totalCount,
      price: Number(pkg.price),
      description: pkg.description,
      status: pkg.status,
      validDays: pkg.validDays,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPkg) {
        await packagesApi.update(editingPkg.id, values);
        message.success('套餐更新成功');
      } else {
        await packagesApi.create(values);
        message.success('套餐创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '操作失败');
    }
  };

  const handleRemove = async (id) => {
    try {
      await packagesApi.remove(id);
      message.success('套餐已下架');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      width: 160,
    },
    {
      title: '适用衣物',
      width: 120,
      render: (_, r) => r.clothingType?.name || '-',
    },
    {
      title: '次数',
      dataIndex: 'totalCount',
      width: 80,
      render: (v) => <span style={{ fontWeight: 'bold' }}>{v}次</span>,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (v) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '单次均价',
      width: 100,
      render: (_, r) => {
        const avg = Number(r.price) / Number(r.totalCount);
        return <span style={{ color: '#52c41a' }}>¥{avg.toFixed(2)}/次</span>;
      },
    },
    {
      title: '有效期',
      dataIndex: 'validDays',
      width: 100,
      render: (v) => v ? `${v}天` : '永久',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => v === 'active' ? <Tag color="green">上架</Tag> : <Tag color="default">下架</Tag>,
    },
    {
      title: '操作',
      width: 150,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(r)}>编辑</Button>
          {r.status === 'active' && (
            <Popconfirm title="确定下架该套餐？" onConfirm={() => handleRemove(r.id)}>
              <Button type="link" size="small" danger>下架</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>套餐管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建套餐
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <AppstoreOutlined style={{ color: '#1677ff' }} />
          <span>套餐购买从会员余额扣款，核销时优先使用套餐次数抵扣，不足部分从余额扣款</span>
        </Space>
      </Card>

      <Table
        dataSource={packages}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 个套餐` }}
      />

      <Modal
        title={editingPkg ? '编辑套餐' : '新建套餐'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingPkg ? '保存' : '创建'}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="套餐名称" rules={[{ required: true, message: '请输入套餐名称' }]}>
            <Input placeholder="如：羽绒服3件套餐" />
          </Form.Item>
          <Form.Item name="clothingTypeId" label="适用衣物类型" rules={[{ required: true, message: '请选择衣物类型' }]}>
            <Select placeholder="选择衣物类型">
              {clothingTypes.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}（¥{Number(c.price).toFixed(2)}/件）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="totalCount" label="套餐次数" rules={[{ required: true, message: '请输入次数' }]}>
              <InputNumber min={1} placeholder="3" addonAfter="次" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="price" label="套餐价格" rules={[{ required: true, message: '请输入价格' }]}>
              <InputNumber min={0} precision={2} placeholder="99" addonAfter="元" style={{ width: 180 }} />
            </Form.Item>
          </Space>
          <Form.Item name="validDays" label="有效天数">
            <InputNumber min={1} placeholder="365" addonAfter="天" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="如：99元洗3件羽绒服，超值优惠" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">上架</Select.Option>
              <Select.Option value="inactive">下架</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Packages;
