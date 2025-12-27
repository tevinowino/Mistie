# React Native + NativeWind Boilerplate

A minimal React Native boilerplate with Expo Router and NativeWind (TailwindCSS) pre-configured.

## 📱 Features

- **Expo Router**: File-based routing
- **NativeWind**: TailwindCSS for React Native
- **TypeScript**: Type-safe development
- **Two Pages**: Home and Explore

## 🏗️ Project Structure

```
nativewind-setup/
├── app/
│   ├── (tabs)/
│   │   ├── home.tsx          # Home page
│   │   ├── explore.tsx       # Explore page
│   │   └── _layout.tsx       # Tab navigation layout
│   ├── _layout.tsx           # Root layout
│   ├── index.tsx             # Entry point
│   └── globals.css           # Global styles
├── assets/                   # Images and fonts
├── babel.config.js
├── metro.config.js
├── tailwind.config.js        # TailwindCSS configuration
├── nativewind-env.d.ts       # NativeWind types
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on your preferred platform**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web
   - Scan QR code with Expo Go app

## 🎨 Using NativeWind

NativeWind allows you to use TailwindCSS classes directly in your React Native components:

```tsx
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-blue-500">
        Hello NativeWind!
      </Text>
    </View>
  );
}
```

## 📦 Key Dependencies

- **expo**: ~54.0.12
- **expo-router**: ~6.0.10 (File-based routing)
- **nativewind**: ^4.2.1 (TailwindCSS for React Native)
- **tailwindcss**: ^3.4.18
- **react-native**: 0.81.4

## 🧪 Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Run linter
npm run lint
```

## 📄 License

MIT License
