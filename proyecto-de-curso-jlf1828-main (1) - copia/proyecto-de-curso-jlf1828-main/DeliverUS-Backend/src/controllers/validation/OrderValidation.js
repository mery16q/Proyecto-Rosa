import { check } from 'express-validator'
import { Restaurant, Product, Order } from '../../models/models.js'

const checkRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(value)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurantId does not exist.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkProducts = async (value, { req }) => {
  try {
    for (const product of value) {
      const productData = await Product.findByPk(product.productId)
      if (productData === null || productData.availability === false) {
        return Promise.reject(new Error('One or more products are not available.'))
      } else if (productData.restaurantId !== req.body.restaurantId) {
        return Promise.reject(new Error('All products must belong to the same restaurant.'))
      }
    }
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkOrderState = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.id)
    if (order.state !== 'pending') {
      return Promise.reject(new Error('The order is not in the pending state.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

// TODO: Include validation rules for create that should:
// 1. Check that restaurantId is present in the body and corresponds to an existing restaurant
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant
const create = [
  check('restaurantId').exists().isInt({ min: 1 }).toInt().custom(checkRestaurantExists),
  check('products').exists().isArray({ min: 1 }).custom(checkProducts)
]
// TODO: Include validation rules for update that should:
// 1. Check that restaurantId is NOT present in the body.
// 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
// 3. Check that products are available
// 4. Check that all the products belong to the same restaurant of the originally saved order that is being edited.
// 5. Check that the order is in the 'pending' state.
const update = [
  check('restaurantId').not().exists(),
  check('products').exists().isArray({ min: 1 }).custom(checkProducts),
  check('id').custom(checkOrderState)
]

/*
const create = [
  check('restaurantId').exists(),
  check('products').exists(),
  check('products').isArray(),
  check('products').notEmpty(),
  check('products..productId').exists().isInt(),
  check('products').custom(checkRestaurantExists),
  check('products').custom(checkProducts),
  check('products..quantity').isInt({ min: 1 }),
  check('address').exists().isString()

]

const update = [
  check('restaurantId').not().exists(),
  check('products').isArray(),
  check('products').notEmpty(),
  check('products..productId').exists().isInt(),
  check('products..quantity').isInt({ min: 1 }),
  check('products').custom(checkProducts),
  check('products').custom(checkOrderState),
  check('address').exists().isString()
]
*/
export { create, update }
