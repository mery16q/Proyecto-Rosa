import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import OrdersScreen from './OrdersScreen'
import OrderDetailScreen from './OrderDetailScreen'
import OrderEditScreen from './OrderEditScreen'
import EditOrderAdressScreen from './EditOrderAdressScreen'
const Stack = createNativeStackNavigator()

export default function OrdersStack () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name='OrdersScreen'
        component={OrdersScreen}
        options={{
          title: 'My Orders'
        }} />
      <Stack.Screen
        name='OrderDetailScreen'
        component={OrderDetailScreen}
        options={{
          title: 'Order Detail'
        }} />
        <Stack.Screen
        name='OrderEditScreen'
        component={OrderEditScreen}
        options={{
          title: 'Order Edit'
        }} />
        <Stack.Screen
        name='EditOrderAddressScreen'
        component={EditOrderAdressScreen}
        options={{
          title: 'Orders Edit Adress'
        }} />
    </Stack.Navigator>
  )
}
