import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function StoreList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await storesApi.list();
      setList(res);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await storesApi.remove(id);
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
        await storesApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await storesApi.create(values);
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
    { title: '门店名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'address' },
    { title: '联系电话', dataIndex: 'phone' },
    { title: '负责人', dataIndex: 'manager' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) =>
        s === 'active' ? <Tag color="green">营业中</Tag> : <Tag color="default">已停用</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', render: (t) => new Date(t).toLocaleString() },
    isAdmin && {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>门店管理</h2>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增门店
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal
        title={editingId ? '编辑门店' : '新增门店'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="门店名称" rules={[{ required: true }]}>
            <Input placeholder="请输入门店名称" />
          </Form.Item>
          <Form.Item name="address" label="门店地址" rules={[{ required: true }]}>
            <Input placeholder="请输入门店地址" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="manager" label="负责人">
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">营业中</Select.Option>
              <Select.Option value="inactive">已停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StoreList;
