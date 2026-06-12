import React, { useState, useEffect } from 'react';
import { Button, Spin, message, Tag, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ordersApi } from '../services/api';

function Voucher() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoucher();
  }, [id]);

  const loadVoucher = async () => {
    try {
      const res = await ordersApi.getVoucher(id);
      setVoucher(res);
    } catch (err) {
      message.error(err.message || '加载凭证失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!voucher) {
    return <div>凭证不存在</div>;
  }

  const statusColor = {
    已收件: 'blue',
    洗涤中: 'purple',
    待取件: 'orange',
    已取件: 'green',
    已取消: 'default',
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }} className="no-print">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回订单
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          打印凭证
        </Button>
      </div>

      <div className="voucher-container" id="voucher-print">
        <div className="voucher-header">
          <div className="voucher-title">🧺 洗衣电子取票凭证</div>
          <div className="voucher-order-no">NO. {voucher.orderNo}</div>
          <div style={{ marginTop: 8 }}>
            <Tag color={statusColor[voucher.statusText]}>{voucher.statusText}</Tag>
          </div>
        </div>

        <div className="voucher-section">
          <div className="voucher-section-title">客户信息</div>
          <div className="voucher-info-grid">
            <div className="voucher-info-item">
              <span className="voucher-info-label">姓名：</span>
              <span className="voucher-info-value">{voucher.customerName}</span>
            </div>
            <div className="voucher-info-item">
              <span className="voucher-info-label">电话：</span>
              <span className="voucher-info-value">{voucher.customerPhone}</span>
            </div>
          </div>
        </div>

        <div className="voucher-section">
          <div className="voucher-section-title">门店信息</div>
          <div className="voucher-info-grid">
            <div className="voucher-info-item">
              <span className="voucher-info-label">门店：</span>
              <span className="voucher-info-value">{voucher.storeName}</span>
            </div>
            <div className="voucher-info-item">
              <span className="voucher-info-label">电话：</span>
              <span className="voucher-info-value">{voucher.storePhone || '-'}</span>
            </div>
            <div className="voucher-info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="voucher-info-label">地址：</span>
              <span className="voucher-info-value">{voucher.storeAddress || '-'}</span>
            </div>
            <div className="voucher-info-item">
              <span className="voucher-info-label">收件人：</span>
              <span className="voucher-info-value">{voucher.staffName || '-'}</span>
            </div>
            <div className="voucher-info-item">
              <span className="voucher-info-label">收件时间：</span>
              <span className="voucher-info-value">
                {dayjs(voucher.createdAt).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
            {voucher.pickupDate && (
              <div className="voucher-info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="voucher-info-label">预计取件：</span>
                <span className="voucher-info-value">
                  {dayjs(voucher.pickupDate).format('YYYY-MM-DD')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="voucher-section">
          <div className="voucher-section-title">衣物明细</div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>
                  衣物名称
                </th>
                <th style={{ border: '1px solid #e8e8e8', padding: 8, width: 80, textAlign: 'center' }}>
                  数量
                </th>
                <th style={{ border: '1px solid #e8e8e8', padding: 8, width: 100, textAlign: 'right' }}>
                  单价
                </th>
                <th style={{ border: '1px solid #e8e8e8', padding: 8, width: 100, textAlign: 'right' }}>
                  小计
                </th>
                <th style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'left' }}>
                  备注
                </th>
              </tr>
            </thead>
            <tbody>
              {voucher.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>
                    {item.clothingName}
                  </td>
                  <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                    ¥{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #e8e8e8', padding: 8, textAlign: 'right' }}>
                    ¥{Number(item.subtotal).toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #e8e8e8', padding: 8 }}>
                    {item.remark || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {voucher.remark && (
          <div className="voucher-section">
            <div className="voucher-section-title">订单备注</div>
            <div style={{ color: '#595959' }}>{voucher.remark}</div>
          </div>
        )}

        <div className="voucher-total">
          <div>
            <div className="voucher-total-label">应收金额</div>
            <div style={{ marginTop: 4, fontSize: 14, color: '#8c8c8c' }}>
              已付：¥{Number(voucher.paidAmount).toFixed(2)}
              <span style={{ marginLeft: 12 }}>
                待付：¥{Number(voucher.unpaidAmount).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="voucher-total-amount">¥{Number(voucher.totalAmount).toFixed(2)}</div>
        </div>

        <div className="voucher-footer">
          <div>请妥善保管此凭证，取件时出示</div>
          <div style={{ marginTop: 4 }}>感谢您的光临，祝您生活愉快！</div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .voucher-container { box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default Voucher;
