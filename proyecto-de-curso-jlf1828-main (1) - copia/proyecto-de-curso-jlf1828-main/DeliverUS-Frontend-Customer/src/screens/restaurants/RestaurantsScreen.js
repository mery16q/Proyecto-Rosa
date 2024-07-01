/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { getRestaurants } from '../../api/RestaurantEndpoints'
import { showMessage } from 'react-native-flash-message'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'

import ImageCard from '../../components/ImageCard'

import { brandPrimary, flashStyle, flashTextStyle } from '../../styles/GlobalStyles'

import { FlatList, ScrollView, Text } from 'react-native-web'
import { getPopular } from '../../api/ProductEndpoints'

import restaurantLogo from '../../../assets/restaurantLogo.jpeg'

export default function RestaurantsScreen ({ navigation, route }) {
  // TODO: Create a state for storing the restaurants
  const [restaurants, setRestaurants] = useState([])
  const [popular, setPopular] = useState([])

  useEffect(() => {
    // TODO: Fetch all restaurants and set them to state.
    //      Notice that it is not required to be logged in.
    async function fetchRestaurants () {
      try {
        const fetchedRestaurants = await getRestaurants()
        setRestaurants(fetchedRestaurants)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurants. ${error} `,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    // TODO: set restaurants to state
    fetchRestaurants()
  }, [route])

  useEffect(() => {
    async function fetchPopular () {
      try {
        const fetchedPopular = await getPopular()
        setPopular(fetchedPopular)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving the popular products ${error}`,
          type: 'error',
          style: flashStyle,
          textStyle: flashTextStyle
        })
      }
    }
    fetchPopular()
  }, [])

  const renderRestaurant = ({ item }) => {
    return (
      <ImageCard
      imageUri={item.logo ? { uri: process.env.API_BASE_URL + '/' + item.logo } : restaurantLogo}
      title={item.name}
      onPress={() => {
        navigation.navigate('RestaurantDetailScreen', { id: item.id })
      }}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        {item.averageServiceTime !== null && <TextSemiBold>Avg. service time: <TextSemiBold textStyle={{ color: brandPrimary }}>{item.averageServiceMinutes} min.</TextSemiBold></TextSemiBold>}
        <TextSemiBold>Shipping: <TextRegular style={{ color: brandPrimary }}>{item.shippingCosts.toFixed(2)} €</TextRegular></TextSemiBold>
      </ImageCard>
    )
  }

  // FR7: Show top 3 products. Rendering the products we have retrieved before

  const renderPopular = ({ item }) => {
    return (
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>{item.name}</Text>
        <ImageCard
          imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : undefined}
          onPress={() => {
            navigation.navigate('RestaurantDetailScreen', { id: item.restaurantId })
          }}
        />
        <TextRegular style={{ marginRight: 100 }} numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
      </View>
    )
  }

  const renderEmptyRestaurant = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No restaurants were retreived. Are you logged in?
      </TextRegular>
    )
  }
  const renderEmptyPopular = () => {
    return (
    <TextRegular textStyle={styles.emptyList}>
        No popular products were retreived. Are you logged in?
      </TextRegular>
    )
  }

  return (
    <ScrollView>
    <View style={styles.container}>
      <FlatList
      ListHeaderComponent={<TextSemiBold textStyle={styles.title}> Top 3 most popular products</TextSemiBold>}
      data={popular}
      renderItem={renderPopular}
      ListEmptyComponent={renderEmptyPopular}
      />
      <FlatList
        ListHeaderComponent={<TextSemiBold textStyle={styles.title}> Restaurants </TextSemiBold>}
        data={restaurants}
        renderItem={renderRestaurant}
        ListEmptyComponent={renderEmptyRestaurant}
      />
    </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  title: {
    textAlign: 'center',
    padding: 50,
    fontSize: 20,
    backgroundColor: GlobalStyles.brandPrimary
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 10,
    width: '100%'
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  cardBody: {
    flex: 5,
    padding: 10
  },
  cardText: {
    marginLeft: 10,
    fontSize: 20,
    alignSelf: 'center',
    fontFamily: 'Montserrat_600SemiBold'
  }
})
