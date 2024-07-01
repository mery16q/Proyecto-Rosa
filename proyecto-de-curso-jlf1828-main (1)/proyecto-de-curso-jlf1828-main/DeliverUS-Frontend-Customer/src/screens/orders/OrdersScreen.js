import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, View, Pressable } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemibold from '../../components/TextSemibold'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { getAllOrders } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import { brandPrimary } from '../../styles/GlobalStyles'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { useNavigation } from '@react-navigation/native'
import ImageCard from '../../components/ImageCard'

export default function OrdersScreen ({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [loggedInUser, route])

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getAllOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders()
    })

    return unsubscribe
  }, [navigation])
  const renderOrder = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + item.restaurant.logo } : undefined}
        onPress={() => {
          navigation.navigate('OrderDetailScreen', { id: item.id })
        }}
      >
      <View style={{ marginLeft: 10 }}>
        <TextSemibold textStyle={{ fontSize: 16, color: 'black' }}>Order {item.id}</TextSemibold>
        <TextSemibold>Created at: <TextRegular numberOfLines={2}>{item.createdAt}</TextRegular></TextSemibold>
        <TextSemibold>Price: <TextRegular style={{ color: brandPrimary }}>{item.price.toFixed(2)} €</TextRegular></TextSemibold>
        <TextSemibold>Shipping: <TextRegular style={{ color: brandPrimary }}>{item.shippingCosts.toFixed(2)} €</TextRegular></TextSemibold>
        <TextSemibold>Status: <TextRegular style={{ color: brandPrimary }}>{item.status}</TextRegular></TextSemibold>
      </View>
      </ImageCard>
    )
  }

  const renderEmptyOrdersList = () => {
    const navigation = useNavigation()
    if (!loggedInUser) {
      return (
        <View style={styles.emptyList}>
          <TextRegular textStyle={styles.text2}>
            Please log in to view your orders.
          </TextRegular>
          <Pressable
            onPress={() => navigation.navigate('Profile', { screen: 'LoginScreen' })}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandPrimaryTap
                  : GlobalStyles.brandPrimary
              },
              styles.button
            ]}
          >
            <TextRegular textStyle={styles.text}>
              Sign in
            </TextRegular>
          </Pressable>
          <TextRegular textStyle={styles.text2}>
            New here?
          </TextRegular>
          <Pressable
            onPress={() => navigation.navigate('Profile', { screen: 'RegisterScreen' })}
            style={({ pressed }) => [
              {
                backgroundColor: pressed
                  ? GlobalStyles.brandPrimaryTap
                  : GlobalStyles.brandPrimary
              },
              styles.button
            ]}>
            <TextRegular textStyle={styles.text}>
              Sign up
            </TextRegular>
          </Pressable>
        </View>
      )
    } else {
      return (
        <TextRegular textStyle={styles.emptyList}>
          You have no orders.
        </TextRegular>
      )
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.container}
        data={orders}
        renderItem={renderOrder}
        ListEmptyComponent={renderEmptyOrdersList}
        keyExtractor={item => item.id.toString()}
        />
    </View>
  )
}

const styles = StyleSheet.create({
  FRHeader: {
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  container: {
    flex: 1,
    margin: 50
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 10
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  text2: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center'
  }
})
