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
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Descriptions,
  Timeline,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserAddOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CrownOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { membersApi, packagesApi } from '../services/api';

const levelMap = {
  normal: { text: '普通会员', color: 'default' },
  silver: { text: '银卡会员', color: '#8c8c8c' },
  gold: { text: '金卡会员', color: '#faad14' },
  platinum: { text: '铂金会员', color: '#722ed1' },
};

const bonusRuleText = '充200送20，充500送80，充1000送200';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [activePackages, setActivePackages] = useState([]);
  const [rechargeRecords, setRechargeRecords] = useState([]);
  const [deductionRecords, setDeductionRecords] = useState([]);
  const [memberPackages, setMemberPackages] = useState([]);
  const [registerForm] = Form.useForm();
  const [rechargeForm] = Form.useForm();
  const [purchaseForm] = Form.useForm();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await membersApi.list({ keyword });
      setMembers(data);
    } catch (err) {
      message.error('加载会员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMembers();
  };

  const handleRegister = async () => {
    try {
      const values = await registerForm.validateFields();
      await membersApi.register(values);
      message.success('会员注册成功');
      setRegisterOpen(false);
      registerForm.resetFields();
      loadMembers();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '注册失败');
    }
  };

  const handleRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields();
      const bonus = Math.floor(values.amount / 1000) * 200
        || Math.floor(values.amount / 500) * 80
        || Math.floor(values.amount / 200) * 20
        || 0;
      await membersApi.recharge({
        memberId: currentMember.id,
        amount: values.amount,
        payType: values.payType,
        remark: values.remark,
      });
      message.success(`充值成功！充值 ¥${values.amount}，赠送 ¥${bonus}`);
      setRechargeOpen(false);
      rechargeForm.resetFields();
      loadMembers();
      if (detailOpen) openDetail(currentMember.id);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '充值失败');
    }
  };

  const handlePurchase = async () => {
    try {
      const values = await purchaseForm.validateFields();
      await membersApi.purchasePackage({
        memberId: currentMember.id,
        packageId: values.packageId,
      });
      message.success('套餐购买成功');
      setPurchaseOpen(false);
      purchaseForm.resetFields();
      loadMembers();
      if (detailOpen) openDetail(currentMember.id);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message || '购买失败');
    }
  };

  const openDetail = async (id) => {
    try {
      const member = await membersApi.get(id);
      setCurrentMember(member);
      setDetailOpen(true);

      const [rr, dr, mp] = await Promise.all([
        membersApi.getRechargeRecords(id),
        membersApi.getDeductionRecords(id),
        membersApi.getMemberPackages(id),
      ]);
      setRechargeRecords(rr);
      setDeductionRecords(dr);
      setMemberPackages(mp);
    } catch (err) {
      message.error('加载详情失败');
    }
  };

  const openRecharge = (member) => {
    setCurrentMember(member);
    rechargeForm.setFieldsValue({ amount: 1000, payType: 'wechat' });
    setRechargeOpen(true);
  };

  const openPurchase = async (member) => {
    setCurrentMember(member);
    try {
      const pkgs = await packagesApi.active();
      setActivePackages(pkgs);
      setPurchaseOpen(true);
    } catch (err) {
      message.error('加载套餐失败');
    }
  };

  const toggleMemberStatus = async (member) => {
    try {
      await membersApi.update(member.id, { isActive: !member.isActive });
      message.success(member.isActive ? '已停用' : '已启用');
      loadMembers();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '会员号',
      dataIndex: 'memberNo',
      width: 180,
      render: (v) => <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</span>,
    },
    {
      title: '姓名',
      width: 100,
      render: (_, r) => r.customer?.name || '-',
    },
    {
      title: '手机号',
      width: 130,
      render: (_, r) => r.customer?.phone || '-',
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 100,
      render: (v) => {
        const lv = levelMap[v] || levelMap.normal;
        return <Tag color={lv.color}>{lv.text}</Tag>;
      },
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 110,
      render: (v) => <span style={{ fontWeight: 'bold', color: '#f5222d' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '累计充值',
      dataIndex: 'totalRecharged',
      width: 110,
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '累计赠送',
      dataIndex: 'totalBonus',
      width: 100,
      render: (v) => <span style={{ color: '#52c41a' }}>¥{Number(v).toFixed(2)}</span>,
    },
    {
      title: '套餐',
      width: 80,
      render: (_, r) => {
        const active = (r.memberPackages || []).filter((p) => p.status === 'active').length;
        return active > 0 ? <Badge count={active} size="small" color="#1677ff" /> : <span style={{ color: '#ccc' }}>0</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (v) => v ? <Tag color="green">正常</Tag> : <Tag color="red">停用</Tag>,
    },
    {
      title: '操作',
      width: 240,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openDetail(r.id)}>详情</Button>
          <Button type="link" size="small" onClick={() => openRecharge(r)} disabled={!r.isActive}>充值</Button>
          <Button type="link" size="small" onClick={() => openPurchase(r)} disabled={!r.isActive}>购套餐</Button>
          <Popconfirm title={r.isActive ? '确定停用该会员？' : '确定启用该会员？'} onConfirm={() => toggleMemberStatus(r)}>
            <Button type="link" size="small" danger={r.isActive}>{r.isActive ? '停用' : '启用'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailTabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: currentMember && (
        <div>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="会员号">{currentMember.memberNo}</Descriptions.Item>
            <Descriptions.Item label="姓名">{currentMember.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentMember.customer?.phone}</Descriptions.Item>
            <Descriptions.Item label="等级">
              <Tag color={levelMap[currentMember.level]?.color}>{levelMap[currentMember.level]?.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="余额">
              <span style={{ fontWeight: 'bold', color: '#f5222d', fontSize: 16 }}>¥{Number(currentMember.balance).toFixed(2)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="累计充值">¥{Number(currentMember.totalRecharged).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="累计赠送">
              <span style={{ color: '#52c41a' }}>¥{Number(currentMember.totalBonus).toFixed(2)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">{currentMember.isActive ? '正常' : '停用'}</Descriptions.Item>
          </Descriptions>

          <Card title="持有套餐" size="small" style={{ marginTop: 16 }}>
            {memberPackages.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: 16 }}>暂无套餐</div>
            ) : (
              <Table
                dataSource={memberPackages}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '套餐名', render: (_, r) => r.package?.name || '-' },
                  { title: '总次数', dataIndex: 'totalCount', width: 80 },
                  { title: '已用', dataIndex: 'usedCount', width: 70 },
                  { title: '剩余', dataIndex: 'remainingCount', width: 70, render: (v) => <span style={{ fontWeight: 'bold', color: v > 0 ? '#1677ff' : '#999' }}>{v}</span> },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 80,
                    render: (v) => {
                      const map = { active: { text: '有效', color: 'green' }, used_up: { text: '已用完', color: 'default' }, expired: { text: '已过期', color: 'red' } };
                      const s = map[v] || { text: v, color: 'default' };
                      return <Tag color={s.color}>{s.text}</Tag>;
                    },
                  },
                  { title: '到期日', dataIndex: 'expireDate', width: 120, render: (v) => v ? new Date(v).toLocaleDateString() : '永久' },
                ]}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'recharge',
      label: '充值记录',
      children: (
        <Timeline
          items={rechargeRecords.map((r) => ({
            color: 'green',
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  充值 ¥{Number(r.amount).toFixed(2)}
                  {Number(r.bonusAmount) > 0 && <span style={{ color: '#52c41a', marginLeft: 8 }}>赠送 ¥{Number(r.bonusAmount).toFixed(2)}</span>}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {r.payType === 'wechat' ? '微信' : r.payType === 'alipay' ? '支付宝' : r.payType === 'bank_card' ? '银行卡' : '现金'}
                  {r.remark && ` · ${r.remark}`}
                  {' · '}{new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
            ),
          }))}
        />
      ),
    },
    {
      key: 'deduction',
      label: '消费记录',
      children: (
        <Timeline
          items={deductionRecords.map((r) => ({
            color: r.deductionType === 'package' ? 'blue' : 'orange',
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {r.deductionType === 'package'
                    ? `套餐核销 ${r.packageCountUsed}次${r.memberPackage?.package?.name ? `（${r.memberPackage.package.name}）` : ''}`
                    : `余额抵扣 ¥${Number(r.balanceUsed).toFixed(2)}`}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  {r.remark && `${r.remark} · `}
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
            ),
          }))}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>会员管理</h2>
        <Space>
          <Input
            placeholder="搜索姓名/手机号/会员号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setRegisterOpen(true)}>
            注册会员
          </Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col><Statistic title="充值规则" value={bonusRuleText} valueStyle={{ fontSize: 13, color: '#faad14' }} /></Col>
        </Row>
      </Card>

      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 位会员` }}
        scroll={{ x: 1200 }}
      />

      <Modal title="注册新会员" open={registerOpen} onCancel={() => setRegisterOpen(false)} onOk={handleRegister} okText="注册">
        <Form form={registerForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址（可选）" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`充值 - ${currentMember?.customer?.name || ''}`}
        open={rechargeOpen}
        onCancel={() => setRechargeOpen(false)}
        onOk={handleRecharge}
        okText="确认充值"
      >
        {currentMember && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="当前余额" value={Number(currentMember.balance)} precision={2} prefix="¥" valueStyle={{ color: '#f5222d' }} />
              </Col>
              <Col span={12}>
                <Statistic title="会员等级" value={levelMap[currentMember.level]?.text} valueStyle={{ color: levelMap[currentMember.level]?.color }} prefix={<CrownOutlined />} />
              </Col>
            </Row>
          </Card>
        )}
        <Form form={rechargeForm} layout="vertical">
          <Form.Item name="amount" label="充值金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} placeholder="输入充值金额" addonAfter="元" />
          </Form.Item>
          <Form.Item name="payType" label="支付方式">
            <Select>
              <Select.Option value="cash">现金</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="bank_card">银行卡</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="备注（可选）" />
          </Form.Item>
        </Form>
        <div style={{ padding: 12, background: '#fffbe6', borderRadius: 6, fontSize: 13 }}>
          <DollarOutlined style={{ color: '#faad14', marginRight: 4 }} />
          充值赠送规则：{bonusRuleText}
        </div>
      </Modal>

      <Modal
        title={`购买套餐 - ${currentMember?.customer?.name || ''}`}
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
        onOk={handlePurchase}
        okText="确认购买"
      >
        {currentMember && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="当前余额" value={Number(currentMember.balance)} precision={2} prefix="¥" valueStyle={{ color: '#f5222d' }} />
              </Col>
            </Row>
          </Card>
        )}
        <Form form={purchaseForm} layout="vertical">
          <Form.Item name="packageId" label="选择套餐" rules={[{ required: true, message: '请选择套餐' }]}>
            <Select placeholder="请选择套餐">
              {activePackages.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name} - ¥{Number(p.price).toFixed(2)}（{p.totalCount}次{p.validDays ? `，有效期${p.validDays}天` : ''}）
                  {p.clothingType?.name ? ` · ${p.clothingType.name}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 6, fontSize: 13 }}>
          <ShoppingOutlined style={{ color: '#1677ff', marginRight: 4 }} />
          购买套餐将从会员余额扣款，请确保余额充足
        </div>
      </Modal>

      <Modal
        title={`会员详情 - ${currentMember?.customer?.name || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={720}
        footer={null}
      >
        {currentMember && (
          <Tabs
            items={detailTabItems}
            tabBarExtraContent={
              <Space>
                <Button type="primary" size="small" onClick={() => { setDetailOpen(false); openRecharge(currentMember); }}>充值</Button>
                <Button size="small" onClick={() => { setDetailOpen(false); openPurchase(currentMember); }}>购买套餐</Button>
              </Space>
            }
          />
        )}
      </Modal>
    </div>
  );
}

export default Members;
