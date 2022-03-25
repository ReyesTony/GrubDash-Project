const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "delivered",
    dishes,
  };
  console.log(newOrder)
  orders.push(newOrder);
  console.log(newOrder, "1")
  res.status(201).json({ data: newOrder });
}
// not the async problem
function bodyHas(propName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propName}` });
  };
}

function quantityIsValidNumber(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    let dish = dishes[i];
    if (dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an interger greater than 0`,
      });
    }
  }
  next ()
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}
function checkDishArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery"];
  const deliveredStatus = ["delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  if (deliveredStatus.includes(status)) {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function checkId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id === orderId || !id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function destory(req, res) {
  const { orderId } = req.params;
  const index = orders.find((order) => order.id === orderId);
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

function checkPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

module.exports = {
  create: [
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    checkDishArray,
    quantityIsValidNumber,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    checkDishArray,
    quantityIsValidNumber,
    checkId,
    statusIsValid,
    update,
  ],
  delete: [orderExists, checkPending, destory],
};
