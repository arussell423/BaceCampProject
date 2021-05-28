import {firebase} from "@firebase/app"; 
import '@firebase/firestore';
import '@firebase/auth';




const firebaseConfig = {
    apiKey: "AIzaSyCoiO6loHTb747_Uxmv_-8ofeV3uMOLNgA",
    authDomain: "bace-camp-project.firebaseapp.com",
    projectId: "bace-camp-project",
    storageBucket: "bace-camp-project.appspot.com",
    messagingSenderId: "425785697698",
    appId: "1:425785697698:web:e0ef45e7120d61a2a5fefb",
    measurementId: "G-VX7CGLB4TJ"
  };


//const firebaseApp = firebase.initializeApp(firebaseConfig);

if (!firebase.apps.length) {
    firebase.initializeApp({firebaseConfig});
 }else {
    firebase.app(); // if already initialized, use that one
 }

const auth = firebase.auth();

export { firebase }  ;