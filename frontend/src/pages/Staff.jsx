import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { staffApi, storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function StaffList() {
  const [list, setList] = useState([]);
  const [stores, setStores] = useState([]);
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
    loadStores();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await staffApi.list();
      setList(res);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const res = await storesApi.list();
      setStores(res.filter((s) => s.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  const roleMap = { admin: '管理员', manager: '店长', staff: '店员' };
  const roleColor = { admin: 'red', manager: 'orange', staff: 'blue' };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ role: 'staff', status: 'active' });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      realName: record.realName,
      phone: record.phone,
      role: record.role,
      storeId: record.storeId,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await staffApi.remove(id);
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
        await staffApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await staffApi.create(values);
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
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'realName' },
    { title: '手机号', dataIndex: 'phone' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (r) => <Tag color={roleColor[r]}>{roleMap[r]}</Tag>,
    },
    { title: '所属门店', dataIndex: ['store', 'name'], render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => (s === 'active' ? <Tag color="green">在职</Tag> : <Tag color="default">已停用</Tag>),
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
        <h2>员工管理</h2>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增员工
          </Button>
        )}
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" loading={loading} />

      <Modal
        title={editingId ? '编辑员工' : '新增员工'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editingId && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, min: 4 }]}>
                <Input.Password placeholder="请输入密码（至少4位）" />
              </Form.Item>
            </>
          )}
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="staff">店员</Select.Option>
              <Select.Option value="manager">店长</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="storeId" label="所属门店">
            <Select placeholder="请选择门店" allowClear>
              {stores.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">在职</Select.Option>
              <Select.Option value="inactive">已停用</Select.Option>
            </Select>
          </Form.Item>
          {editingId && (
            <Form.Item name="password" label="重置密码">
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default StaffList;
