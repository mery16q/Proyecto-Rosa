import React, { useEffect, useState, useContext } from 'react'
import { StyleSheet, FlatList, View, Pressable } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemibold from '../../components/TextSemibold'
import { showMessage } from 'react-native-flash-message'
import { getOrderDetail, remove } from '../../api/OrderEndpoints'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import productLogo from '../../../assets/product.jpeg'
import ImageCard from '../../components/ImageCard'
import { useNavigation } from '@react-navigation/native'
import DeleteModal from '../../components/DeleteModal'

export default function OrderDetailScreen ({ route }) {
  const [order, setOrder] = useState({})
  const { loggedInUser } = useContext(AuthorizationContext)
  const navigation = useNavigation()
  const [orderToBeDeleted, setOrderToBeDeleted] = useState(null)

  useEffect(() => {
    async function fetchOrderDetail () {
      try {
        const fetchedOrder = await getOrderDetail(route.params.id)
        setOrder(fetchedOrder)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving order details (id ${route.params.id}). ${error}`,
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

  const renderEmptyProductsList = () => {
    return (
      <TextRegular style={styles.emptyList}>
        This order has no products.
      </TextRegular>
    )
  }

  const renderProduct = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : productLogo}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemibold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemibold>
        <TextSemibold>
          Quantity: <TextRegular>{item.OrderProducts.quantity}</TextRegular>
        </TextSemibold>
      </ImageCard>
    )
  }

  const cancelOrder = async (order) => {
    try {
      await remove(order.id)
      setOrderToBeDeleted(null)
      showMessage({
        message: `Order ${order.id} successfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })

      navigation.goBack()
    } catch (error) {
      console.log(error)
      setOrderToBeDeleted(null)
      showMessage({
        message: `Order ${order.id} could not be cancelled.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.container}
        data={order?.products || []}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyProductsList}
      />
      {order.status === 'pending' && (
        <>
          <Pressable
            onPress={() => navigation.navigate('OrderEditScreen', { order })}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? GlobalStyles.brandPrimaryTap : GlobalStyles.brandPrimary
              },
              styles.buttonPending
            ]}
          >
            <TextRegular textStyle={styles.text}>Edit Order</TextRegular>
          </Pressable>
          <Pressable
            onPress={() => setOrderToBeDeleted(order)}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? GlobalStyles.brandPrimaryTap : GlobalStyles.brandPrimary
              },
              styles.buttonPending
            ]}
          >
            <TextRegular textStyle={styles.text}>Cancel Order</TextRegular>
          </Pressable>
        </>
      )}
      {orderToBeDeleted && (
        <DeleteModal
          isVisible={true}
          onCancel={() => setOrderToBeDeleted(null)}
          onConfirm={() => cancelOrder(orderToBeDeleted)}
        >
          <TextRegular>Are you sure you want to cancel your order?</TextRegular>
        </DeleteModal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  price: {
    color: GlobalStyles.brandPrimary,
    fontSize: 16
  },
  buttonPending: {
    textAlign: 'center',
    borderRadius: 8,
    width: '30%',
    padding: 10,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 12
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center'
  }
})
