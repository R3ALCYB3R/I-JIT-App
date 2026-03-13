import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Modal, 
  ScrollView, 
  Linking, 
  ActivityIndicator, 
  StatusBar, 
  Alert, 
  Vibration,
  Dimensions
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPairingFile, setHasPairingFile] = useState(false);
  const [installedApps, setInstalledApps] = useState({});

  // The JIT App List with Deep Link Schemes
  const jitApps = [
    { id: 'geode', name: 'Geode SDK', scheme: 'geode://', dev: 'Geometry Dash Mods', color: '#32D74B' },
    { id: 'melonx', name: 'MeloNX', scheme: 'melonx://', dev: 'Switch Emulator', color: '#E60012' },
    { id: 'provenance', name: 'Provenance', scheme: 'provenance://', dev: 'Multi-Core Emulator', color: '#5856D6' },
    { id: 'dolphin', name: 'DolphiniOS', scheme: 'dolphinios://', dev: 'Wii/GameCube', color: '#007AFF' },
    { id: 'utm', name: 'UTM', scheme: 'utm://', dev: 'Virtual Machines', color: '#FF9500' },
  ];

  // The Steps for the "How to Pair" Modal
  const steps = [
    { text: "1. Log on to your computer.", type: "text" },
    { text: "2. Install iLoader from SideStore 🌐", type: "link", url: "https://sidestore.io/#install" },
    { text: "3. Connect device via USB port.", type: "text" },
    { text: "4. Get the Pairing file.", type: "text" },
    { text: "5. Download StikDebug 📥", type: "link", url: "https://apps.apple.com/app/stikdebug/id6476446333" },
    { text: "6. Put the pairing file into StikDebug.", type: "text" },
    { text: "7. Move the final .plist into the iJIT folder.", type: "text" },
  ];

  // Check which apps are actually installed on the device
  const scanForApps = async () => {
    let results = {};
    for (let app of jitApps) {
      try {
        const supported = await Linking.canOpenURL(app.scheme);
        results[app.id] = supported;
      } catch (e) {
        results[app.id] = false;
      }
    }
    setInstalledApps(results);
  };

  // Main Enable JIT Action
  const handleEnableJIT = async () => {
    setIsScanning(true);
    Vibration.vibrate(15); // Haptic feedback: button press
    
    // Simulate system scan delay for 2.5 seconds
    setTimeout(async () => {
      const docDir = FileSystem.documentDirectory;
      // Check for both lowercase and camelCase just in case
      const f1 = await FileSystem.getInfoAsync(docDir + 'pairingfile.plist');
      const f2 = await FileSystem.getInfoAsync(docDir + 'pairingFile.plist');

      setIsScanning(false);

      if (f1.exists || f2.exists) {
        Vibration.vibrate([0, 80, 40, 80]); // Success vibration pattern
        setHasPairingFile(true);
        scanForApps();
        Alert.alert("⚡ iJIT ACTIVE", "Pairing file found! System linked and ready to run emulators.");
      } else {
        Vibration.vibrate(500); // Long error vibration
        setHasPairingFile(false);
        Alert.alert(
          "❌ PAIRING ERROR", 
          "pairingfile.plist not found! Open the Files app and make sure the file is in 'On My iPhone > iJIT'."
        );
      }
    }, 2500);
  };

  const openURL = (url) => {
    Linking.openURL(url).catch((err) => console.error("Link error:", err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {!hasPairingFile ? (
        /* --- LANDING SCREEN --- */
        <View style={styles.landingContent}>
          <View style={styles.glowLogo}>
             <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.appName}>iJIT</Text>

          <TouchableOpacity 
            style={[styles.mainBtn, isScanning && styles.btnActive]} 
            onPress={handleEnableJIT}
            disabled={isScanning}
          >
            {isScanning ? (
              <View style={styles.row}>
                <ActivityIndicator color="#000" />
                <Text style={styles.mainBtnText}>  LINKING...</Text>
              </View>
            ) : (
              <Text style={styles.mainBtnText}>ENABLE JIT</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.howToBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.howToText}>How to Pair</Text>
          </TouchableOpacity>

          <View style={styles.helloBox}>
            <Text style={styles.helloTitle}>Hello!</Text>
            <Text style={styles.helloSubtitle}>Add a pairing file to begin!</Text>
          </View>
        </View>
      ) : (
        /* --- DASHBOARD SCREEN --- */
        <View style={styles.dashboard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity onPress={() => setHasPairingFile(false)} style={styles.lockBtn}>
               <Text style={styles.lockBtnText}>LOCK</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
            {jitApps.map(app => (
              <View key={app.id} style={styles.appCard}>
                <View style={[styles.appIndicator, {backgroundColor: app.color}]} />
                <View style={{flex: 1}}>
                  <Text style={styles.appCardTitle}>{app.name}</Text>
                  <Text style={styles.appCardStatus}>
                    {installedApps[app.id] ? "READY TO BOOST" : "NOT FOUND"}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.runBtn, !installedApps[app.id] && styles.runBtnDisabled]}
                  onPress={() => installedApps[app.id] ? openURL(app.scheme) : Alert.alert("Missing App", "Install this app to use JIT.")}
                >
                  <Text style={styles.runBtnText}>{installedApps[app.id] ? "RUN" : "—"}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* SETUP MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pairing Workflow</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {steps.map((s, i) => (
                <TouchableOpacity 
                  key={i} 
                  disabled={s.type === "text"}
                  onPress={() => s.type === "link" && openURL(s.url)}
                  style={[styles.stepCard, s.type === "link" && styles.stepCardLink]}
                >
                  <Text style={styles.stepCardText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.successNote}>✨ Refresh app once file is added!</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  landingContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  glowLogo: { 
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#111', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, 
    borderColor: '#32D74B', shadowColor: '#32D74B', shadowOpacity: 0.8, 
    shadowRadius: 20, marginBottom: 20, elevation: 10 
  },
  logoText: { fontSize: 80 },
  appName: { color: '#FFF', fontSize: 48, fontWeight: '900', marginBottom: 50, letterSpacing: 1 },
  
  mainBtn: { backgroundColor: '#32D74B', width: width * 0.85, paddingVertical: 22, borderRadius: 25, alignItems: 'center' },
  btnActive: { backgroundColor: '#1A5C26', opacity: 0.8 },
  mainBtnText: { color: '#000', fontSize: 22, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  howToBtn: { marginTop: 25 },
  howToText: { color: '#007AFF', fontSize: 18, fontWeight: '700', textDecorationLine: 'underline' },
  
  helloBox: { marginTop: 80, alignItems: 'center' },
  helloTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  helloSubtitle: { color: '#8E8E93', fontSize: 16, marginTop: 5 },

  /* DASHBOARD STYLES */
  dashboard: { flex: 1, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35, marginTop: 20 },
  headerTitle: { color: '#FFF', fontSize: 34, fontWeight: '900' },
  lockBtn: { backgroundColor: '#1C1C1E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  lockBtnText: { color: '#FF3B30', fontSize: 12, fontWeight: '900' },
  
  appCard: { 
    flexDirection: 'row', backgroundColor: '#121212', padding: 20, borderRadius: 22, 
    marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C1E' 
  },
  appIndicator: { width: 4, height: 35, borderRadius: 2, marginRight: 15 },
  appCardTitle: { color: '#FFF', fontSize: 19, fontWeight: 'bold' },
  appCardStatus: { color: '#636366', fontSize: 12, fontWeight: '800', marginTop: 2 },
  runBtn: { backgroundColor: '#32D74B', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  runBtnDisabled: { backgroundColor: '#2C2C2E', opacity: 0.5 },
  runBtnText: { fontWeight: '900', fontSize: 14, color: '#000' },

  /* MODAL STYLES */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '85%' },
  modalTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 25 },
  stepCard: { backgroundColor: '#2C2C2E', padding: 18, borderRadius: 18, marginBottom: 12 },
  stepCardLink: { borderLeftWidth: 5, borderLeftColor: '#007AFF', backgroundColor: '#232325' },
  stepCardText: { color: '#FFF', fontSize: 16, lineHeight: 22 },
  successNote: { color: '#32D74B', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  closeBtn: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 } 
});
