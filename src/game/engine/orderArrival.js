export const settleArrivingOrders = ({
  pendingOrders = [],
  inventory = [],
  facility,
  absoluteDay,
  getConfiguredModelPrice,
  random = Math.random,
}) => {
  let updatedInventory = inventory.map(car => ({ ...car, stockDays: (car.stockDays || 0) + 1 }));
  const remainingOrders = pendingOrders.filter(order => order.arriveDay > absoluteDay).map(order => ({ ...order }));
  const logs = [];
  const arrivingOrders = pendingOrders.filter(order => order.arriveDay <= absoluteDay);

  for (const order of arrivingOrders) {
    const totalSlots = (facility.showroomSpots || 0) + (facility.warehouseCapacity || 0);
    const availableSlots = totalSlots - updatedInventory.length;
    const canArrive = Math.min(order.quantity, availableSlots);
    if (canArrive > 0) {
      const newCars = Array.from({ length: canArrive }).map(() => ({
        id: random().toString(36).slice(2, 11),
        modelId: order.modelId,
        price: getConfiguredModelPrice(order.modelId),
        color: order.color,
        subsidized: false,
        stockDays: 0,
        location: 'warehouse',
        draftId: order.draftId || null,
        purchasePaymentMethod: order.paymentMethod || 'cash',
      }));
      updatedInventory = [...updatedInventory, ...newCars];
      logs.push({ day: absoluteDay, type: 'success', message: `🚛【车辆到货】${order.modelName} ${canArrive} 台已运抵仓储区！${canArrive < order.quantity ? `因库位不足，${order.quantity - canArrive} 台无法入库，厂家暂缓发运。` : ''}` });
    } else {
      logs.push({ day: absoluteDay, type: 'warning', message: `🚛【到货延迟】${order.modelName} ${order.quantity} 台已运抵，但库位已满无法入库！厂家暂缓发运，需腾出空位后联系厂家重新安排。` });
      remainingOrders.push({ ...order, arriveDay: absoluteDay + 1 });
    }
  }

  return {
    inventory: updatedInventory,
    pendingOrders: remainingOrders,
    logs,
  };
};
