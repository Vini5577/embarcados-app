import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Vibration, View, AppState, StyleSheet } from 'react-native';
import axios from 'axios';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

const API_ENDPOINT = 'https://api.thingspeak.com/channels/2575303/feeds.json?api_key=W9HV6VIN1WRZDN0E';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [status, setStatus] = useState('SEGURO');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_ENDPOINT);

        console.log('API data fetched:', response.data);
        const feeds = response.data.feeds;
        const lastAlertData = feeds[feeds.length - 1].created_at;
        console.log('olha a data', lastAlertData);
        if (lastAlertData && isRecentAttempt(lastAlertData)) {
          setStatus('PERIGO');
          triggerAlert();
          const alertDateTime = new Date(lastAlertData);
          const formattedDateTime = alertDateTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false });
          setHistory(prevHistory => [...prevHistory, { time: formattedDateTime }]);
        } else {
          setStatus('SEGURO');
        }
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    };

    const intervalId = setInterval(() => {
      fetchData();
    }, 500);

    fetchData();

    return () => clearInterval(intervalId);
  }, []);

  const isRecentAttempt = (timestamp) => {
    const now = new Date();
    const attemptTime = new Date(timestamp);
    const diff = now - attemptTime;
    return diff <= 5000;
  };

  const triggerAlert = async () => {
    Vibration.vibrate([3000, 2000, 3000]);

    const soundObject = new Audio.Sound();
    await soundObject.loadAsync(require('./assets/Danger.mp3'));
    await soundObject.playAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alerta de Segurança',
        body: 'Tentativa de invasão detectada!',
      },
      trigger: null,
    });
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={[styles.status, status === 'PERIGO' ? styles.statusDanger : styles.statusSafe]}>
          {status}
        </Text>
        <ScrollView style={styles.history}>
          {history.map((record, index) => (
            <Text key={index} style={styles.historyText}>
              Tentativa de invasão em: {record.time}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: 32,
    marginTop: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textAlign: 'center',
    color: 'white',
    borderRadius: 50,
  },
  statusSafe: {
    backgroundColor: 'green',
  },
  statusDanger: {
    backgroundColor: 'red',
  },
  history: {
    marginTop: 5,
    width: '100%',
    borderTopWidth: 1,
    borderColor: 'gray',
    paddingVertical: 3,
  },
  historyText: {
    fontSize: 16,
    marginHorizontal: 4,
    textAlign: 'center',
  },
});
