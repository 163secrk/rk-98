import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { clothingApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function ClothingTypes() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canEdit = isAdmin || isManager;

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await clothingApi.list();
      setList(res);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', price: 0 });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await clothingApi.remove(id);
      message.success('删除成功');
      loadList();
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await clothingApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await clothingApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadList();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '操作失败');
    }
  };

  const columns = [
    { title: '衣物类型', dataIndex: 'name' },
    { title: '单价（元）', dataIndex: 'price', render: (v) => `¥${Number(v).toFixed(2)}` },
    { title: '描述', dataIndex: 'description', render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => (s === 'active' ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    canEdit && {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {isAdmin && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>衣物类型管理</h2>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增类型
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal
        title={editingId ? '编辑衣物类型' : '新增衣物类型'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="类型名称" rules={[{ required: true }]}>
            <Input placeholder="请输入类型名称" />
          </Form.Item>
          <Form.Item name="price" label="单价（元）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入单价" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ClothingTypes;
