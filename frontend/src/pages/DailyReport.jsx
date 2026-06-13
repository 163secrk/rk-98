import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  ReloadOutlined,
  ExportOutlined,
  DollarCircleOutlined,
  CreditCardOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  FundOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportsApi, storesApi } from '../services/api';
import { useAuthStore } from '../store/auth';

const { RangePicker } = DatePicker;

function DailyReport() {
  const [list, setList] = useState([]);
  const [totals, setTotals] = useState({
    orderRevenue: 0,
    rechargeAmount: 0,
    packageAmount: 0,
    consumableCost: 0,
    netIncome: 0,
  });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    storeId: undefined,
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  });
  const { user } = useAuthStore();

  useEffect(() => {
    loadStores();
    loadReport();
  }, []);

  const loadStores = async () => {
    try {
      const res = await storesApi.list();
      setStores(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.storeId) params.storeId = filters.storeId;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (user?.role === 'staff' && user?.storeId) {
        params.storeId = user.storeId;
      }
      const res = await reportsApi.getDailyReport(params);
      setList(res.list);
      setTotals(res.totals);
    } catch (err) {
      message.error(err.message || '加载报表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filters.storeId) params.storeId = filters.storeId;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (user?.role === 'staff' && user?.storeId) {
        params.storeId = user.storeId;
      }
      const blob = await reportsApi.exportDailyReport(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `财务日结报表_${params.startDate || 'all'}_${params.endDate || 'all'}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error(err.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      fixed: 'left',
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      width: 160,
      fixed: 'left',
    },
    {
      title: '订单实收',
      dataIndex: 'orderRevenue',
      width: 140,
      align: 'right',
      render: (v) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '会员充值',
      dataIndex: 'rechargeAmount',
      width: 140,
      align: 'right',
      render: (v) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '套餐购买',
      dataIndex: 'packageAmount',
      width: 140,
      align: 'right',
      render: (v) => (
        <span style={{ color: '#722ed1', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '耗材成本',
      dataIndex: 'consumableCost',
      width: 140,
      align: 'right',
      render: (v) => (
        <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>
      ),
    },
    {
      title: '净收入',
      dataIndex: 'netIncome',
      width: 140,
      fixed: 'right',
      align: 'right',
      render: (v) => (
        <span
          style={{
            color: Number(v) >= 0 ? '#52c41a' : '#f5222d',
            fontWeight: 'bold',
            fontSize: 15,
          }}
        >
          ¥{Number(v).toFixed(2)}
        </span>
      ),
    },
  ];

  const summaryColumns = [
    {
      title: '汇总',
      dataIndex: 'label',
      width: 120,
      fixed: 'left',
      render: () => <strong style={{ fontSize: 15 }}>合计</strong>,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      width: 160,
      render: () => '-',
    },
    {
      title: '订单实收',
      dataIndex: 'orderRevenue',
      width: 140,
      align: 'right',
      render: () => (
        <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 15 }}>
          ¥{Number(totals.orderRevenue).toFixed(2)}
        </span>
      ),
    },
    {
      title: '会员充值',
      dataIndex: 'rechargeAmount',
      width: 140,
      align: 'right',
      render: () => (
        <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 15 }}>
          ¥{Number(totals.rechargeAmount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '套餐购买',
      dataIndex: 'packageAmount',
      width: 140,
      align: 'right',
      render: () => (
        <span style={{ color: '#722ed1', fontWeight: 'bold', fontSize: 15 }}>
          ¥{Number(totals.packageAmount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '耗材成本',
      dataIndex: 'consumableCost',
      width: 140,
      align: 'right',
      render: () => (
        <span style={{ color: '#fa8c16', fontWeight: 'bold', fontSize: 15 }}>
          ¥{Number(totals.consumableCost).toFixed(2)}
        </span>
      ),
    },
    {
      title: '净收入',
      dataIndex: 'netIncome',
      width: 140,
      fixed: 'right',
      align: 'right',
      render: () => (
        <span
          style={{
            color: Number(totals.netIncome) >= 0 ? '#52c41a' : '#f5222d',
            fontWeight: 'bold',
            fontSize: 17,
          }}
        >
          ¥{Number(totals.netIncome).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card size="small">
            <Statistic
              title="订单实收合计"
              value={totals.orderRevenue}
              precision={2}
              prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card size="small">
            <Statistic
              title="会员充值合计"
              value={totals.rechargeAmount}
              precision={2}
              prefix={<CreditCardOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card size="small">
            <Statistic
              title="套餐购买合计"
              value={totals.packageAmount}
              precision={2}
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card size="small">
            <Statistic
              title="耗材成本合计"
              value={totals.consumableCost}
              precision={2}
              prefix={<ShoppingCartOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4.8}>
          <Card size="small">
            <Statistic
              title="净收入合计"
              value={totals.netIncome}
              precision={2}
              prefix={<FundOutlined style={{ color: totals.netIncome >= 0 ? '#52c41a' : '#f5222d' }} />}
              valueStyle={{ color: totals.netIncome >= 0 ? '#52c41a' : '#f5222d' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          {(!user?.storeId || user?.role === 'admin') && (
            <Select
              placeholder="选择门店"
              value={filters.storeId}
              onChange={(v) => setFilters({ ...filters, storeId: v })}
              style={{ width: 180 }}
              allowClear
            >
              {stores.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          )}
          <RangePicker
            value={filters.dateRange}
            onChange={(v) => setFilters({ ...filters, dateRange: v })}
          />
          <Button icon={<ReloadOutlined />} onClick={loadReport}>
            查询
          </Button>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            导出CSV
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={list}
        rowKey={(record) => `${record.date}_${record.storeId}`}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              {summaryColumns.map((col) => (
                <Table.Summary.Cell
                  key={col.dataIndex || col.title}
                  index={0}
                  align={col.align}
                >
                  {col.render ? col.render() : col.title}
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}

export default DailyReport;
