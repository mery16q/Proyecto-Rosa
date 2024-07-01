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
