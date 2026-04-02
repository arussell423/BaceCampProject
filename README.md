# BACE Camp Project

A React Native mobile application built with Expo for managing camps and user authentication using Firebase.

## Features

- 📱 Cross-platform mobile app (iOS, Android, Web)
- 🔐 Firebase Authentication
- 💾 Firestore Database
- 🎨 React Native UI Components
- ✅ Form Validation with Formik and Yup
- 🔐 Secure password strength meter

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BaceCampProject
``` 

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see [Environment Setup](#environment-setup))

4. Start the development server:
```bash
npm start
```

## Running the Application

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Project Structure

```
src/
├── components/
│   └── Navigator.js          # Main navigation component
├── screens/
│   ├── LoginScreen.js        # Login screen
│   ├── SignupScreen.js       # Signup screen
│   └── HomeScreen.js         # Home screen
├── services/
│   └── FirebaseService.js    # Firebase configuration
└── config/
    └── env.example.js        # Environment configuration template
```

## Environment Setup

⚠️ **SECURITY ALERT**: Never commit Firebase credentials directly to the repository!

1. Create a `.env` file in the root directory (see `.env.example`):

```javascript
// .env.js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

2. Add `.env.js` to `.gitignore` to prevent accidental commits

3. Use the environment file in your code instead of hardcoding credentials

## Dependencies

- **react**: UI library
- **react-native**: Native mobile development
- **expo**: Development platform
- **firebase**: Backend services
- **react-navigation**: Screen navigation
- **formik**: Form state management
- **yup**: Form validation
- **react-native-elements**: UI components

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run eject` - Eject from Expo (⚠️ this is permanent)

## Security Considerations

1. **Never commit API keys** - Use environment variables instead
2. **Validate user input** - All forms use Formik + Yup validation
3. **Use Firebase Security Rules** - Configure proper access controls in Firestore
4. **Update dependencies regularly** - Run `npm audit` to check for vulnerabilities

## Troubleshooting

### Port Already in Use
```bash
expo start -c  # Clear cache and restart
```

### Clear Cache and Reinstall
```bash
rm -rf node_modules
npm install
expo start -c
```

### Firebase Connection Issues
- Verify your Firebase configuration in the environment file
- Check that your Firebase project is active and has the necessary APIs enabled
- Ensure Firestore and Authentication are enabled in your Firebase console

## Contributing

Please follow the standard Git workflow:
1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/feature-name`
4. Create a Pull Request

## License

This project is private. For licensing information, contact the project owner.

## Support

For issues and questions, please open an issue on the GitHub repository.