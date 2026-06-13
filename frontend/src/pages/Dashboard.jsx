import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RedEnvelopeOutlined,
  ScheduleOutlined,
  CrownOutlined,
  GiftOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { ordersApi, membersApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const params = {};
      if (user?.role === 'staff' && user?.storeId) {
        params.storeId = user.storeId;
      }
      const [orderRes, memberRes] = await Promise.all([
        ordersApi.getStats(params),
        membersApi.getStats(),
      ]);
      setStats(orderRes);
      setMemberStats(memberRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总金额"
              value={stats?.totalAmount || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已收款"
              value={stats?.totalPaid || 0}
              precision={2}
              prefix={<RedEnvelopeOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待收款"
              value={stats?.totalUnpaid || 0}
              precision={2}
              prefix={<ScheduleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="会员总数"
              value={memberStats?.totalMembers || 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃会员"
              value={memberStats?.activeMembers || 0}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="会员总余额"
              value={memberStats?.totalBalance || 0}
              precision={2}
              prefix={<WalletOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="有效套餐"
              value={memberStats?.activePackages || 0}
              prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="份"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="已收件"
              value={stats?.statusCounts?.received || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="洗涤中"
              value={stats?.statusCounts?.washing || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="待取件"
              value={stats?.statusCounts?.ready || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="已取件"
              value={stats?.statusCounts?.delivered || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="已取消"
              value={stats?.statusCounts?.cancelled || 0}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
