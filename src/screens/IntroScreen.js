import React, { Component } from 'react'
import {View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
    const styles = StyleSheet.create({
        container: {
            backgroundColor: '#ffffff',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
        },
        headerContainer: {
          top: 30,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        heading: {
          color: 'white',
          marginTop: 10,
          fontSize: 22,
          fontWeight: 'bold',
        },
        contentView: {
          marginTop: 40,
          justifyContent: 'center',
        alignItems: 'center',
          backgroundColor: '#ffffff',
        },
        
        
      });

    

export class IntroScreen extends Component {

    static navigationOptions = {
        headerShown: false,
      };

    render() {
        return (
            <View>
            
            <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Ionicons name="md-tennisball-outline" size={50} color="#000" />
            <Text style={{fontSize:18,fontWeight:'bold'}}>Welcome to Bace Camp</Text>
            <Text style={{fontSize:16,fontWeight:'bold', textAlign: 'center' }}>
                            The best App for Tennis Fitness workouts and Competition planner
            </Text>
                    </View>
                    <Image
                source={require('../assets/image/bACE_CAMP-logo-transparent.png')}
                style={{width: '100%', height: 300}}
                    />
                    <View style={styles.contentView}>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('EmailInputScreen')}
            style={{ backgroundColor: '#008000', borderRadius: 5, marginVertical: 10, height: 50, width: 300, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{fontWeight: 'bold', fontSize: 23, color: 'white'}}>Get started</Text>
          </TouchableOpacity>
          <Text style={{fontSize:18,fontWeight:'bold',textAlign: 'center', color: 'grey'}}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('LoginScreen')}>
            <Text style={{fontSize:18,fontWeight:'bold',textAlign: 'center', color: '#87cefa'}}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
                </View>
                
            </View>

            
            
        )
        
    }
    

}




export default IntroScreen
