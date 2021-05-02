import React, { Component } from 'react'
import {View, StyleSheet,ActivityIndicator,TouchableOpacity,} from 'react-native';
import {Text, Icon, Image, Button} from 'react-native-elements';
import { Assets } from 'react-navigation-stack';


    
    


    const styles = StyleSheet.create({
        container: {
            backgroundColor: '#F4F6FA', height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        headerContainer: {
            top: 30,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40
        },
    });

export class IntroScreen extends Component {
    render() {
        return (
            <View>
                <Text> IntroScreen </Text>
            
            <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Icon name="md-tennisball-outline" size={80} type="ionicon" />
            <Text h4>Welcome to Bace Camp</Text>
            <Text h5 style={{ textAlign: 'center' }}>
                            The best App for Tennis Fitness workouts and Competition planner
            </Text>
            <Image
                source={require('../assets/image/bACECAMP.png')}
                style={{width: '100%', height: 300}}
                PlaceholderContent={<ActivityIndicator />}
            />
        </View>
                </View>
                </View>
        )
    }
}



export default IntroScreen