/*
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, TextInput, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getOrderDetail, update } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import TextError from '../../components/TextError'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { Formik } from 'formik'
import * as yup from 'yup'

export default function OrderEditScreen ({ navigation, route }) {
  const [order, setOrder] = useState({})
  const { loggedInUser } = useContext(AuthorizationContext)
  const [backendErrors, setBackendErrors] = useState([])

  useEffect(() => {
    async function fetchOrderDetail () {
      try {
        const fetchedOrder = await getOrderDetail(route.params.order.id)
        setOrder(fetchedOrder)
        console.log('Fetched order:', fetchedOrder)
      } catch (error) {
        console.error('Error fetching order details:', error)
        showMessage({
          message: `There was an error while retrieving order details (id ${route.params.order.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    if (loggedInUser) {
      fetchOrderDetail()
    } else {
      setOrder(null)
    }
  }, [loggedInUser, route])

  const renderProduct = ({ item, index, handleChange, values }) => {
    const totalPrice = item.price * (values.products[index]?.quantity || 0)
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold>{item.price.toFixed(2)}€</TextSemiBold>
        <TextRegular>Total Price: {totalPrice.toFixed(2)}€</TextRegular>
        <View>
          <TextRegular>Quantity:</TextRegular>
          <View style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 50 }}>
              <TextInput
                style={styles.row}
                placeholder='0'
                keyboardType='numeric'
                onChangeText={handleChange(`products[${index}].quantity`)}
                value={values.products[index]?.quantity?.toString() || ''}
              />
            </View>
          </View>
        </View>
      </ImageCard>
    )
  }

  const renderEmptyProductsList = () => {
    return (
      <TextRegular style={styles.emptyList}>
        This order has no products.
      </TextRegular>
    )
  }

  const updateOrder = async (values) => {
    setBackendErrors([])
    try {
      console.log('Updating order with values:', values)
      const updatedOrderData = {
        ...order,
        products: values.products.map((product, index) => ({
          productId: order.products[index].id,
          quantity: parseInt(product.quantity)
        })).filter(product => product.quantity > 0)
      }
      console.log('Updated order data:', updatedOrderData)
      const updatedOrder = await update(order.id, updatedOrderData)
      console.log('Order successfully updated:', updatedOrder)
      showMessage({
        message: `Order ${updatedOrder.id} successfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.goBack()
    } catch (error) {
      console.error('Error updating order:', error)
      setBackendErrors(error.errors)
      showMessage({
        message: `There was an error updating the order. ${error.message}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <Formik
      initialValues={{ products: order.products || [] }}
      validationSchema={yup.object({
        products: yup.array().of(
          yup.object({
            quantity: yup.number().required('Quantity is required').min(1, 'Minimum quantity is 1')
          })
        )
      })}
      onSubmit={updateOrder}
      enableReinitialize
    >
      {({ handleChange, handleSubmit, values }) => (
        <View style={styles.container}>
          {backendErrors &&
            backendErrors.map((error, index) => <TextError key={index}>{error.msg}</TextError>)
          }
          <FlatList
            data={order.products || []}
            renderItem={({ item, index }) => renderProduct({ item, index, handleChange, values })}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyProductsList}
          />
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandGreenTap
                  : GlobalStyles.brandGreen
              },
              styles.button
            ]}
          >
            <TextSemiBold style={{ color: 'white' }}>
              Confirm Changes
            </TextSemiBold>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('EditOrderAddressScreen', { order })}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandBlueTap
                  : GlobalStyles.brandBlue
              },
              styles.button
            ]}
          >
            <TextSemiBold style={{ color: 'white' }}>
              Edit Address
            </TextSemiBold>
          </Pressable>

        </View>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    width: '80%',
    textAlign: 'center'
  }
})
*/

/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetailRestaurants } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { update } from '../../api/OrderEndpoints'
import { Formik } from 'formik'
import * as yup from 'yup'
import InputItem from '../../components/InputItem'
import TextError from '../../components/TextError'

export default function EditOrderScreen ({ navigation, route }) {
  // const [orderDetails, setOrderDetails] = useState({})
  const [restaurantDetails, setRestaurantDetails] = useState({})
  const [productosdeseados, setproductosdeseados] = useState(new Map())
  const [backendErrors, setBackendErrors] = useState([])

  const [initialOrderValues, setInitialOrderValues] = useState({ startedAt: null, sentAt: null, deliveredAt: null, price: null, adress: null, shippingCosts: null, restaurantId: null, userId: null, createdAt: null, updatedAt: null })
  const validationSchema = yup.object().shape({
    address: yup
      .string()
      .max(255, 'Address too long')
      .required('Address is required')
  })

  useEffect(() => {
    async function fetchOrderDetail () {
      try {
        // const initialValues = buildInitialValues(route.params.order, initialOrderValues)
        setInitialOrderValues(route.params.order)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving order details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchOrderDetail()
  }, [route])

  useEffect(() => {
    const fetchProductsDeseados = () => {
      for (const product of route.params.order.products) {
        productosdeseados.set(product.id, product.OrderProducts.quantity)
      }
    }
    fetchProductsDeseados()
  }, [route]
  )

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      try {
        const fetchedRestaurantDetails = await getDetailRestaurants(route.params.order.restaurantId)
        setRestaurantDetails(fetchedRestaurantDetails)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant details (id ${route.parames.order.restaurantId}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchRestaurantDetail()
  }, [route])

  const updateOrder = async (values) => {
    setBackendErrors([])
    const productos = []
    for (const product of productosdeseados.keys()) {
      productos.push({
        productId: product,
        quantity: productosdeseados.get(product)
      })
    }
    const Updatedvalues = {
      address: values.address,
      products: productos
    }
    try {
      const updatedOrder = await update(route.params.order.id, Updatedvalues)
      showMessage({
        message: `Order ${updatedOrder.id} succesfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('OrdersScreen')
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  const renderHeader = () => {
    return (
      <View>
        <Formik
        enableReinitialize
        validationSchema={validationSchema}
        initialValues={initialOrderValues}
        onSubmit={updateOrder}>
        {({ handleSubmit, values }) => (
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
            <InputItem
                  name='address'
                  label='Address:'
                  value={values.address}
                />
            {backendErrors &&
                  backendErrors.map((error, index) => <TextError key={index}>{error.param}-{error.msg}</TextError>)
            }

          <Pressable
                onPress={ handleSubmit }
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? GlobalStyles.brandSuccessTap
                      : GlobalStyles.brandSuccess
                  },
                  styles.button
                ]}>
                <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name='content-save' color={'white'} size={20}/>
                  <TextRegular textStyle={styles.text}>
                    Save
                  </TextRegular>
                </View>
              </Pressable>
            </View>
          </View>
        )
        }
      </Formik>
      </View>
    )
  }

  const renderProduct = ({ item }) => {
    const añadirproducto = (product) => {
      const productos = new Map(productosdeseados)
      if (productos.has(product)) {
        productos.set(product, productos.get(product) + 1)
      } else {
        productos.set(product, 1)
      }
      setproductosdeseados(productos)
    }

    const eliminarproducto = (product) => {
      const productos = new Map(productosdeseados)
      if (productos.has(product) && productos.get(product) > 0) {
        productos.set(product, productos.get(product) - 1)
        if (productos.get(product) === 0) {
          productos.delete(product)
        }
      }
      setproductosdeseados(productos)
    }
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
        {!item.availability &&
          <TextRegular textStyle={styles.availability }>Not available</TextRegular>
        }

    <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
    {item.availability && <Pressable
          onPress={() => eliminarproducto(item.id)}
          style={() => [styles.button2]}>
          <View style={[{ flex: 5, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='minus-circle' color={'black'} size={20} />
          </View>
      </Pressable>}
      <TextRegular> {productosdeseados.get(item.id)}</TextRegular>
      {item.availability && <Pressable
          onPress={() => añadirproducto(item.id)}
          style={() => [styles.button2]}>
          <View style={[{ flex: 5, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='plus-circle' color={'black'} size={20} />
          </View>
      </Pressable>}
    </View>
    </ImageCard>
    )
  }

  return (
      <FlatList
          ListHeaderComponent={renderHeader}
          style={styles.container}
          data={restaurantDetails.products}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          DescartarPedido
        />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  }
})
