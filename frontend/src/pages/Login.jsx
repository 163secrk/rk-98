import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth';

function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      setAuth(res.accessToken, res.user);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-title">🧺 连锁洗衣店管理系统</div>
        <div className="login-subtitle">O2O Management System</div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登 录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            默认账号：admin / admin123
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Login;
