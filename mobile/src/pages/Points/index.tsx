import React, {useState, useEffect}  from 'react';
import { View, TouchableOpacity, Text, ScrollView, Image, Alert } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { SvgUri } from 'react-native-svg';
import * as Location from 'expo-location';

import api from '../../services/api';
import styles from './styles';

interface Item {
  id: number,
  title: string,
  image_url: string,
}

interface Point {
  id: number,
  image: string,
  image_url: string,
  name: string,
  latitude: number,
  longitude: number,
}

interface Params {
  uf: string,
  city: string,
}

const Points = () => {
  const navigation = useNavigation();

  const [items, setItems] = useState<Item[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [initalPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadPosition(){
      const { status } = await Location.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Ops...','Precisamos de permissão para a localização');
        return;
      }

      const location = await Location.getCurrentPositionAsync();

      const { latitude, longitude } = location.coords;

      setInitialPosition([ latitude, longitude]);
    }

    loadPosition();
  },[]);
    
  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    api.get('points', {
      params: {
        city: routeParams.city,
        uf: routeParams.uf,
        items: selectedItems
      }
    }).then(response => {
      setPoints(response.data);
    })
  }, [selectedItems]);

  function handleNavigateBack(){
    navigation.goBack();
  }

  function handleNavigateToDetail(id: number){
    navigation.navigate('Detail', {point_id: id});
  }

  function handleSelectItem(id: number){
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if(alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([ ...selectedItems, id]);
    }
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleNavigateBack}>
          <Icon name="arrow-left" size={20} color="#34cb79"/>
        </TouchableOpacity>

        <Text style={styles.title}>Bem vindo.</Text>
        <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>

        <View style={styles.mapContainer}>
          { initalPosition[0] !== 0 && (
            <MapView 
            style={styles.map}
            loadingEnabled={initalPosition[0] === 0}
            initialRegion={{
              latitude: initalPosition[0],
              longitude: initalPosition[1],
              latitudeDelta: 0.014,
              longitudeDelta: 0.014,
            }}
          >
            {points.map(point => (
              <Marker 
                key={String(point.id)}
                style={styles.mapMarker}
                onPress={() => handleNavigateToDetail(point.id)}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
              }}>
                <View style={styles.mapMarkerContainer}>
                  <Image style={styles.mapMarkerImage} source={{ uri: point.image_url}}/>
            <Text style={styles.mapMarkerTitle}>{point.name}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          )}
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <ScrollView
          contentContainerStyle={{paddingHorizontal: 22}}
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          {items.map(item => (
            <TouchableOpacity
              activeOpacity={0.5}
              key={String(item.id)} 
              style={[
                styles.item,
                selectedItems.includes(item.id) ? styles.selectedItem : {}
              ]} 
              onPress={() => handleSelectItem(item.id)}
            >
            <SvgUri width={42} height={42} uri={item.image_url}/>
          <Text style={styles.itemTitle}>{item.title}</Text>
          </TouchableOpacity>
          ))}

        </ScrollView>
      </View>
    </>
  );
}

export default Points;