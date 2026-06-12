import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Customer } from '../entities/customer.entity';
import { Staff } from '../entities/staff.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(100000 + Math.random() * 900000);
    return `LD${dateStr}${random}`;
  }

  async create(createOrderDto: CreateOrderDto, user: Staff): Promise<Order> {
    const storeId = createOrderDto.storeId || user.storeId;
    if (!storeId) {
      throw new BadRequestException('请选择门店');
    }

    let customer = await this.customerRepository.findOne({
      where: { phone: createOrderDto.customerPhone },
    });
    if (!customer) {
      customer = this.customerRepository.create({
        name: createOrderDto.customerName,
        phone: createOrderDto.customerPhone,
        address: createOrderDto.customerAddress,
      });
      customer = await this.customerRepository.save(customer);
    }

    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const order = this.orderRepository.create({
      orderNo: this.generateOrderNo(),
      storeId,
      staffId: user.id,
      customerId: customer.id,
      customerName: createOrderDto.customerName,
      customerPhone: createOrderDto.customerPhone,
      customerAddress: createOrderDto.customerAddress,
      totalAmount,
      paidAmount: createOrderDto.paidAmount || 0,
      remark: createOrderDto.remark,
      pickupDate: createOrderDto.pickupDate ? new Date(createOrderDto.pickupDate) : null,
      status: OrderStatus.RECEIVED,
      items: createOrderDto.items.map((item) => ({
        ...item,
        subtotal: item.unitPrice * item.quantity,
      })),
    });

    return this.orderRepository.save(order);
  }

  async findAll(query: {
    storeId?: string;
    status?: OrderStatus;
    keyword?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Order[]> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.staff', 'staff')
      .orderBy('order.createdAt', 'DESC');

    if (query.storeId) {
      qb.andWhere('order.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere(
        '(order.orderNo LIKE :keyword OR order.customerName LIKE :keyword OR order.customerPhone LIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }
    if (query.startDate) {
      qb.andWhere('DATE(order.createdAt) >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('DATE(order.createdAt) <= :endDate', { endDate: query.endDate });
    }

    const orders = await qb.getMany();
    return orders.map((o) => {
      if (o.staff) delete o.staff.password;
      return o;
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'store', 'staff'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.staff) delete order.staff.password;
    return order;
  }

  async findByOrderNo(orderNo: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNo },
      relations: ['items', 'store', 'staff'],
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.staff) delete order.staff.password;
    return order;
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = updateDto.status;
    return this.orderRepository.save(order);
  }

  async generateVoucher(id: string) {
    const order = await this.findOne(id);
    return {
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      storeName: order.store?.name,
      storeAddress: order.store?.address,
      storePhone: order.store?.phone,
      staffName: order.staff?.realName,
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      unpaidAmount: Number(order.totalAmount) - Number(order.paidAmount),
      status: order.status,
      statusText: this.getStatusText(order.status),
      remark: order.remark,
      pickupDate: order.pickupDate,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        clothingName: item.clothingName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        remark: item.remark,
      })),
    };
  }

  private getStatusText(status: OrderStatus): string {
    const map = {
      [OrderStatus.RECEIVED]: '已收件',
      [OrderStatus.WASHING]: '洗涤中',
      [OrderStatus.READY]: '待取件',
      [OrderStatus.DELIVERED]: '已取件',
      [OrderStatus.CANCELLED]: '已取消',
    };
    return map[status] || status;
  }

  async getStats(query: { storeId?: string; startDate?: string; endDate?: string } = {}) {
    const qb = this.orderRepository.createQueryBuilder('order');

    if (query.storeId) {
      qb.andWhere('order.storeId = :storeId', { storeId: query.storeId });
    }
    if (query.startDate) {
      qb.andWhere('DATE(order.createdAt) >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('DATE(order.createdAt) <= :endDate', { endDate: query.endDate });
    }

    const allOrders = await qb.getMany();

    const totalOrders = allOrders.length;
    const totalAmount = allOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalPaid = allOrders.reduce((sum, o) => sum + Number(o.paidAmount), 0);

    const statusCounts = {
      received: allOrders.filter((o) => o.status === OrderStatus.RECEIVED).length,
      washing: allOrders.filter((o) => o.status === OrderStatus.WASHING).length,
      ready: allOrders.filter((o) => o.status === OrderStatus.READY).length,
      delivered: allOrders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: allOrders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    };

    return {
      totalOrders,
      totalAmount,
      totalPaid,
      totalUnpaid: totalAmount - totalPaid,
      statusCounts,
    };
  }
}
