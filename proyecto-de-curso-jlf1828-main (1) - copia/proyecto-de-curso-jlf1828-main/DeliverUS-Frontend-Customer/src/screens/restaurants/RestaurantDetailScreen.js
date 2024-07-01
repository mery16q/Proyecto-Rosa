/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, TextInput, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/RestaurantEndpoints'
import { create } from '../../api/OrderEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import TextError from '../../components/TextError'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { Formik } from 'formik'
import * as yup from 'yup'

export default function RestaurantDetailScreen ({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const { loggedInUser } = useContext(AuthorizationContext)
  const [quant, setQuantity] = useState({})
  const [precio, setPrecio] = useState({})
  const [backendErrors, setBackendErrors] = useState()

  useEffect(() => {
    async function fetchRestaurantDetail () {
      try {
        const fetchedRestaurant = await getDetail(route.params.id)
        setRestaurant(fetchedRestaurant)
        setQuantity(new Array(fetchedRestaurant.products.length).fill(0))
        setPrecio(new Array(fetchedRestaurant.products.length).fill(0))
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchRestaurantDetail()
  }, [loggedInUser, route])

  const renderHeader = (handleSubmit) => {
    if (!loggedInUser) {
      return (
      <View>
        <ImageBackground source={(restaurant?.heroImage) ? { uri: process.env.API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined} style={styles.imageBackground}>
          <View style={styles.restaurantHeaderContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
            <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
            <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
          </View>
        </ImageBackground>
      </View>
      )
    } else {
      return (
        <View>
          <ImageBackground source={(restaurant?.heroImage) ? { uri: process.env.API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined} style={styles.imageBackground}>
            <View style={styles.restaurantHeaderContainer}>
              <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
              <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
              <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
              <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
            </View>
          </ImageBackground>
        <View style={{ flexDirection: 'row', marginHorizontal: 5 }}>
            <Pressable
              onPress={() => navigation.navigate('RestaurantsScreen', { id: restaurant.id })}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandPrimaryTap
                    : GlobalStyles.brandPrimary
                },
                styles.halfButton
              ]}>
              <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                <TextSemiBold style={{ color: 'white' }}>
                  Dismiss order
                </TextSemiBold>
              </View>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandGreenTap
                    : GlobalStyles.brandGreen
                },
                styles.halfButton
              ]}>
              <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                <TextSemiBold style={{ color: 'white' }}>
                  Confirm order
                </TextSemiBold>
              </View>
            </Pressable>
          </View>
        </View>)
    }
  }

  function updateQuantityPrice ({ quantity, item, index }) {
    const newPrecio = [...precio]
    newPrecio[index] = item.price * (parseInt(quantity) || 0)

    const newQuant = [...quant]
    newQuant[index] = parseInt(quantity) || 0

    setPrecio(newPrecio)
    setQuantity(newQuant)
  }

  const renderProduct = ({ item, index, handleChange, values }) => {
    const totalPrice = item.price * (quant[index] || 0)
    if (loggedInUser) {
      return (
        <ImageCard
          imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
          title={item.name}
        >
          <TextRegular numberOfLines={2}>{item.description}</TextRegular>
          <TextSemiBold>{item.price.toFixed(2)}€</TextSemiBold>
          <TextRegular>Total Price: {totalPrice.toFixed(2)}€</TextRegular>
          {!item.availability &&
            <TextRegular>Not available</TextRegular>
          }
          <View>
            <TextRegular>
              Quantity:
            </TextRegular>
            <View style={{ alignItems: 'flex-start' }}>
              <View style = {{ width: 50 }}>
                <TextInput
                  style={ styles.row }
                  placeholder = '0'
                  keyboardType = 'numeric'
                  onChangeText={(quantity) => {
                    handleChange(`products[${index}].quantity`)(quantity)
                    updateQuantityPrice({ quantity, item, index })
                  }}
                  value={values.products[index]?.quantity ? values.products[index].quantity.toString() : ''}
                />
              </View>
            </View>
          </View>
        </ImageCard>
      )
    } else {
      return (
        <ImageCard
          imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
          title={item.name}
        >
          <TextRegular numberOfLines={2}>{item.description}</TextRegular>
          <TextSemiBold>{item.price.toFixed(2)}€</TextSemiBold>
          {!item.availability &&
            <TextRegular>Not available</TextRegular>
          }
        </ImageCard>
      )
    }
  }

  const renderEmptyProductsList = () => {
    return (
      <TextRegular>
        This restaurant has no products yet.
      </TextRegular>
    )
  }

  const createOrder = async (values) => {
    setBackendErrors([])
    try {
      const orderData = {
        createdAt: Date(),
        startedAt: null,
        sentAt: null,
        deliveredAt: null,
        price: precio.reduce((a, b) => a + b, 0),
        address: loggedInUser.address,
        shippingCosts: null,
        restaurantId: restaurant.id,
        userId: loggedInUser.id,
        status: 'pending',
        products: values.products.map((product, index) => ({
          productId: restaurant.products[index].id,
          quantity: parseInt(product.quantity)
        })).filter(product => product.quantity > 0)

      }
      console.log(restaurant.products)
      console.log(orderData)
      const createdOrder = await create(orderData)
      console.log(createdOrder)
      showMessage({
        message: `Order ${createdOrder.id} succesfully created`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('My Orders', { screen: 'OrdersScreen' }, { dirty: true })
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  return (
    <Formik
      initialValues={{ products: restaurant.products || [] }}
      validationSchema={yup.object({
        products: yup.array().of(
          yup.object({
            quantity: yup.number().required('Quantity is required').min(1, 'Minimum quantity is 1')
          })
        )
      })}

      onSubmit={createOrder}
    >
      {({ handleChange, handleSubmit, values }) => (
        <View style={styles.container}>
          {backendErrors &&
            backendErrors.map((error, index) => <TextError key={index}>{error.msg}</TextError>)
          }
          <FlatList
            ListHeaderComponent={() => renderHeader(handleSubmit)}
            ListEmptyComponent={renderEmptyProductsList}
            data={restaurant.products || []}
            renderItem={({ item, index }) => renderProduct({ item, index, handleChange, values })}
            keyExtractor={(item) => item.id.toString()}
          />
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
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
  buttonText: {
    color: 'white'
  },
  halfButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '50%'
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
  }
})
