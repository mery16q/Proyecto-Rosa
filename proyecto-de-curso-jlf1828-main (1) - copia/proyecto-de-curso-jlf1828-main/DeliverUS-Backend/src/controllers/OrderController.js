// eslint-disable-next-line no-unused-vars
import { Order, Product, Restaurant, User, sequelizeSession } from '../models/models.js'
import moment from 'moment'
import { Op } from 'sequelize'
import { validationResult } from 'express-validator'

const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date.add(1, 'days') // FIXME: se pasa al siguiente día a las 00:00
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
const indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the indexCustomer function that queries orders from current logged-in customer and send them back.
// Orders have to include products that belongs to each order and restaurant details
// sort them by createdAt date, desc.
const indexCustomer = async function (req, res) {
  try {
    const orders = await Order.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Product,
        as: 'products'
      }, {
        model: Restaurant,
        as: 'restaurant',
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }],
      order: [['createdAt', 'DESC']]
    })

    for (const order of orders) {
      const orderProducts = []
      for (const product of order.products) {
        if (product.OrderProducts.OrderId === order.id) {
          orderProducts.push(product)
        }
      }
      order.products = [...orderProducts]
    }
    res.json(orders)
  } catch (error) {
    res.status(500).send(error)
  }
}

// TODO: Implement the create function that receives a new order and stores it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the order and related products, start a transaction, store the order, store each product linea and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction

const create = async function (req, res) {
  let newOrder = Order.build(req.body)

  const transaction = await sequelizeSession.transaction()

  try {
    newOrder.price = 0.0

    for (const elem of req.body.products) {
      const product = await Product.findByPk(elem.productId)
      newOrder.price += product.price * elem.quantity
    }

    if (newOrder.price >= 10) { newOrder.shippingCosts = 0.0 } else {
      const restaurant = await Restaurant.findByPk(req.body.restaurantId)
      newOrder.shippingCosts = restaurant.shippingCosts
    }

    newOrder.price += newOrder.shippingCosts

    newOrder.userId = req.user.id // usuario actualmente autenticado

    newOrder = await newOrder.save({ transaction })

    for (const elem of req.body.products) {
      const product = await Product.findByPk(elem.productId)
      const price = product.price

      newOrder.addProducts(elem.productId, {
        through: {
          quantity: elem.quantity,
          unityPrice: price
        }
      }, { transaction })
    }

    await transaction.commit()

    await newOrder.reload({
      include: [{
        model: Product,
        as: 'products'
      }]
    })

    res.json(await Order.findByPk(newOrder.id, {
      include: [{
        model: Product,
        as: 'products'
      }]
    }))
  } catch (err) {
    await transaction.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the update function that receives a modified order and persists it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the updated order and updated products, start a transaction, update the order, remove the old related OrderProducts and store the new product lines, and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction
const update = async function (req, res) {
  const transaction = await sequelizeSession.transaction()
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Product,
        as: 'products'
      }]
    })
    order.price = 0.0

    for (const product of req.body.products) {
      const databaseProduct = await Product.findByPk(product.productId)
      order.price += product.quantity * databaseProduct.price
    }

    if (order.price >= 10) {
      order.shippingCosts = 0.0
    } else {
      const restaurant = await Restaurant.findByPk(order.restaurantId)
      order.shippingCosts = restaurant.shippingCosts
    }
    order.price += order.shippingCosts

    for (const elem of order.products) {
      await order.removeProduct(elem, { transaction })
    }

    for (const elem of req.body.products) {
      const product = await Product.findByPk(elem.productId)
      const price = product.price

      order.addProducts(elem.productId, {
        through: {
          quantity: elem.quantity,
          unityPrice: price
        }
      }, { transaction })
    }
    req.body.price = order.price
    req.body.shippingCosts = order.shippingCosts
    Order.update(req.body, { where: { id: req.params.orderId } }, { transaction })

    await transaction.commit()

    await order.reload({
      include: [{
        model: Product,
        as: 'products'
      }]
    })

    res.json(await Order.findByPk(order.id, {
      include: [{
        model: Product,
        as: 'products'
      }]
    }))
  } catch (err) {
    await transaction.rollback()
    res.status(500).send(err)
  }
}

// TODO: Implement the destroy function that receives an orderId as path param and removes the associated order from the database.
// Take into account that:
// 1. The migration include the "ON DELETE CASCADE" directive so OrderProducts related to this order will be automatically removed.
const destroy = async function (req, res) {
  try {
    const result = await Order.destroy({ where: { id: req.params.orderId } })

    let message
    if (result === 1) {
      message = 'Successfully deleted order with id: ' + req.params.orderId
    } else {
      message = 'Could not delete the order.'
    }

    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

const analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}

const OrderController = {
  indexRestaurant,
  indexCustomer,
  create,
  update,
  destroy,
  confirm,
  send,
  deliver,
  show,
  analytics
}
export default OrderController
