import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  CrownOutlined,
  GiftOutlined,
  InboxOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/orders', icon: <UnorderedListOutlined />, label: '订单管理' },
    { key: '/orders/create', icon: <PlusCircleOutlined />, label: '录入收件单' },
    { key: '/members', icon: <CrownOutlined />, label: '会员管理' },
    { key: '/packages', icon: <GiftOutlined />, label: '套餐管理' },
    { key: '/stores', icon: <ShopOutlined />, label: '门店管理' },
    { key: '/staff', icon: <TeamOutlined />, label: '员工管理' },
    { key: '/clothing-types', icon: <AppstoreOutlined />, label: '衣物类型' },
    { key: '/consumables', icon: <InboxOutlined />, label: '耗材管理' },
    { key: '/reports/daily', icon: <PieChartOutlined />, label: '财务日结报表' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const getRoleText = (role) => {
    const map = { admin: '管理员', manager: '店长', staff: '店员' };
    return map[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: '#001529' }}
        className="no-print"
      >
        <div className="app-logo">
          <span style={{ fontSize: 24 }}>🧺</span>
          {!collapsed && <span>洗衣店管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          className="no-print"
        >
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            连锁洗衣店O2O管理系统
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.realName}（{getRoleText(user?.role)}）
                {user?.storeName && <span style={{ color: '#999' }}> - {user.storeName}</span>}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
