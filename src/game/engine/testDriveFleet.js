export const prepareSetTestDriveCar = ({
  modelId,
  inventory,
  testDriveCars,
  carModels,
  currentDay,
}) => {
  const modelDef = carModels.find(model => model.id === modelId);
  if (!modelDef) return { status: 'invalid' };

  if (testDriveCars.find(testDriveCar => testDriveCar.modelId === modelId)) {
    return { status: 'already_exists', alert: { title: '设置失败', message: '该车型已有试驾车！' } };
  }

  const car = inventory.find(item => item.modelId === modelId);
  if (!car) {
    return { status: 'no_stock', alert: { title: '设置失败', message: '该车型当前无库存！' } };
  }

  return {
    status: 'ready',
    car,
    confirm: {
      title: '设置试驾车',
      message: `将一台 ${modelDef.name} 设为试驾车？该车不可销售，但该车型转化率+5%。`,
    },
    inventory: inventory.filter(item => item.id !== car.id),
    testDriveCars: [...testDriveCars, { modelId, day: currentDay, carId: car.id }],
    log: { type: 'info', message: `🚗【试驾车】${modelDef.name} 已设为试驾车，该车型转化率+5%。` },
  };
};

export const prepareRetireTestDriveCar = ({
  modelId,
  inventory,
  testDriveCars,
  carModels,
  getConfiguredModelPrice,
}) => {
  const modelDef = carModels.find(model => model.id === modelId);
  const testDriveCar = testDriveCars.find(item => item.modelId === modelId);
  if (!modelDef || !testDriveCar) return { status: 'invalid' };

  return {
    status: 'ready',
    confirm: {
      title: '退役试驾车',
      message: `将 ${modelDef.name} 试驾车退役回库存？`,
    },
    inventory: [
      ...inventory,
      { id: testDriveCar.carId, modelId, price: getConfiguredModelPrice(modelId), location: 'warehouse', stockDays: 0, color: '黑' },
    ],
    testDriveCars: testDriveCars.filter(item => item.modelId !== modelId),
    log: { type: 'info', message: `🚗【试驾退役】${modelDef.name} 试驾车退役回库存。` },
  };
};
