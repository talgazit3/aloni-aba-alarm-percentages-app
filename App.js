import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Modal } from 'react-native';
// --- תוספת 1: ייבוא ספריות להתראות ---
import * as Notifications from 'expo-notifications';

// --- תוספת 2: הגדרת הצגת התראות כשהאפליקציה פתוחה ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [screen, setScreen] = useState('login'); 
  const [role, setRole] = useState('user');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [registeredUsers, setRegisteredUsers] = useState([
    { id: '1', name: 'גזית המפתח', phone: '0500000000', street: 'האלונים' }
  ]);

  const [currentUserId, setCurrentUserId] = useState(null);

  // --- תוספת קריטית: בקשת הרשאה מהמשתמש ברגע שהאפליקציה נפתחת ---
  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen === 'user' && currentUserId) {
      const userExists = registeredUsers.some(u => u.id === currentUserId);
      if (!userExists) {
        setScreen('login');
        setCurrentUserId(null);
        Alert.alert("נותקת", "המשתמש שלך הוסר על ידי המנהל");
      }
    }
  }, [registeredUsers, screen, currentUserId]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [passInput, setPassInput] = useState('');

  const [reporterPass, setReporterPass] = useState("10379154");
  const [developerPass, setDeveloperPass] = useState("4468800");

  const [appData, setAppData] = useState({
    dailyPercent: "15%",
    dailySchedule: "14:00 - 16:00", 
    nearFuture: "2%",
    updateFullDate: "03/03/2026",
    updateTime: "15:00"
  });

  const [incomingReports, setIncomingReports] = useState([]);
  const [reportText, setReportText] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleLogin = () => {
    if (role === 'user') {
      if (!isReturningUser) {
        if (name.length < 2 || phone.length < 9 || street.length < 2) {
          return Alert.alert("פרטים חסרים", "נא למלא את כל השדות לרישום");
        }
        const newId = Date.now().toString();
        const newUser = { id: newId, name, phone, street };
        setRegisteredUsers([...registeredUsers, newUser]);
        setCurrentUserId(newId);
      } else {
        const existing = registeredUsers.find(u => u.phone === phone);
        if (existing) setCurrentUserId(existing.id);
        else return Alert.alert("שגיאה", "משתמש לא נמצא במערכת");
      }
      setScreen('user');
    } else {
      const correctPass = role === 'reporter' ? reporterPass : developerPass;
      if (passInput === correctPass) setScreen(role);
      else Alert.alert("שגיאה", "סיסמה שגויה");
    }
  };

  const removeUser = (id) => {
    Alert.alert(
      "מחיקת משתמש",
      "האם אתה בטוח? המשתמש ינותק מהמערכת מיד.",
      [
        { text: "ביטול", style: "cancel" },
        { text: "מחק ונתק", style: "destructive", onPress: () => {
          setRegisteredUsers(registeredUsers.filter(u => u.id !== id));
        }}
      ]
    );
  };

  const submitReport = () => {
    if (reportText.length < 3) return Alert.alert("שגיאה", "הדיווח קצר מדי");
    const newReport = { id: Date.now().toString(), user: name || "תושב", msg: reportText };
    setIncomingReports([newReport, ...incomingReports]);
    setReportText('');
    setIsReportModalOpen(false);
    Alert.alert("הדיווח הגיע אל מפתח האפליקציה");
  };

  const handleReporterUpdate = () => {
    const now = new Date();
    
    // --- תוספת 3: שליחת ההתראה בזמן אמת ---
    Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ עדכון מצב - אלוני אבא",
        body: `הנתונים עודכנו לסיכוי של ${appData.dailyPercent}`,
        sound: true,
      },
      trigger: null,
    });

    setAppData({
      ...appData, 
      updateFullDate: now.toLocaleDateString('he-IL'),
      updateTime: now.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})
    });
    setShowSuccessModal(true); 
  };

  if (screen === 'login') {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.mainTitle}>Alarm Percentages</Text>
        <Text style={styles.subTitle}>אלוני אבא</Text>
        
        {role === 'user' ? (
          <>
            {!isReturningUser && <TextInput style={styles.input} placeholder="שם מלא" placeholderTextColor="#888" onChangeText={setName} />}
            <TextInput style={styles.input} placeholder="מספר טלפון" keyboardType="phone-pad" placeholderTextColor="#888" onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="רחוב" placeholderTextColor="#888" onChangeText={setStreet} />
            <TextInput style={[styles.input, {backgroundColor: '#222', color: '#888'}]} value="יישוב: אלוני אבא" editable={false} />
            <TouchableOpacity onPress={() => setIsReturningUser(!isReturningUser)}>
              <Text style={styles.toggleText}>{isReturningUser ? "אני משתמש חדש (להרשמה)" : "כבר נרשמתי בעבר"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TextInput style={styles.input} placeholder="סיסמה סודית" secureTextEntry placeholderTextColor="#888" onChangeText={setPassInput} />
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
          <Text style={styles.btnText}>{isReturningUser ? "התחברות" : "כניסה"}</Text>
        </TouchableOpacity>

        <View style={styles.roleRow}>
          {['user', 'reporter', 'developer'].map(r => (
            <TouchableOpacity key={r} onPress={() => {setRole(r); setPassInput('');}} style={[styles.roleTab, role === r && styles.activeTab]}>
              <Text style={{color: '#fff'}}>{r === 'user' ? 'תושב' : r === 'reporter' ? 'מדווח' : 'מפתח'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (screen === 'user') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={styles.menuBtn}>
            <View style={styles.menuLine}/><View style={styles.menuLine}/><View style={styles.menuLine}/>
          </TouchableOpacity>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={styles.welcomeTitle}>שלום, {name || "תושב"}</Text>
            <Text style={styles.dateTimeText}>{currentTime.toLocaleDateString('he-IL')} | {currentTime.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, {backgroundColor: '#1c2833'}]}><Text style={styles.cardT}>סיכוי יומי לאזעקה</Text><Text style={styles.cardV}>{appData.dailyPercent}</Text></View>
          <View style={[styles.card, {backgroundColor: '#7b241c'}]}><Text style={styles.cardT}>שעות משוערות לאזעקה</Text><Text style={styles.cardV}>{appData.dailySchedule}</Text></View>
          <View style={[styles.card, {backgroundColor: '#935116'}]}><Text style={styles.cardT}>סיכוי לאזעקה עכשיו</Text><Text style={styles.cardV}>{appData.nearFuture}</Text></View>
          <View style={[styles.card, {backgroundColor: '#212f3c'}]}>
             <Text style={styles.cardT}>זמן עדכון אחרון</Text>
             <Text style={styles.cardV}>{appData.updateTime}</Text>
             <Text style={{color: '#888', fontSize: 10}}>{appData.updateFullDate}</Text>
          </View>
        </View>

        <Modal visible={isMenuOpen} transparent animationType="fade">
          <View style={styles.sidebar}>
            <TouchableOpacity onPress={() => setIsMenuOpen(false)}><Text style={{color: '#fff', fontSize: 30}}>✕</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setIsMenuOpen(false); setIsReportModalOpen(true);}}><Text style={styles.menuText}>דווח על בעיה</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setScreen('login'); setIsMenuOpen(false); setCurrentUserId(null);}}><Text style={[styles.menuText, {color: '#e74c3c'}]}>התנתק</Text></TouchableOpacity>
          </View>
        </Modal>

        <Modal visible={isReportModalOpen} transparent>
          <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <Text style={styles.modalTitle}>דווח על בעיה</Text>
            <TextInput style={styles.textArea} multiline placeholder="מה קרה?" placeholderTextColor="#666" onChangeText={setReportText} />
            <TouchableOpacity style={styles.primaryBtn} onPress={submitReport}><Text style={styles.btnText}>שלח</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsReportModalOpen(false)} style={{marginTop: 10}}><Text style={{color: '#888', textAlign: 'center'}}>ביטול</Text></TouchableOpacity>
          </View></View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (screen === 'reporter') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeTitle}>עדכון אחוזים לאזעקה</Text>
        <Text style={styles.label}>אחוז סיכוי יומי לאזעקה</Text>
        <TextInput style={styles.input} placeholder="למשל: 30%" placeholderTextColor="#888" onChangeText={t => setAppData({...appData, dailyPercent: t})} />
        <Text style={styles.label}>מתי בערך יהיו אזעקות (שעות)</Text>
        <TextInput style={styles.input} placeholder="למשל: 12:00-14:00" placeholderTextColor="#888" onChangeText={t => setAppData({...appData, dailySchedule: t})} />
        <Text style={styles.label}>אחוז סיכוי לאזעקה בזמן הקרוב</Text>
        <TextInput style={styles.input} placeholder="למשל: 80%" placeholderTextColor="#888" onChangeText={t => setAppData({...appData, nearFuture: t})} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleReporterUpdate}><Text style={styles.btnText}>פרסם עדכון לכולם</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('login')} style={{marginTop: 20}}><Text style={{color: '#888', textAlign: 'center'}}>חזרה</Text></TouchableOpacity>

        <Modal visible={showSuccessModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
              <Text style={{fontSize: 50, marginBottom: 15}}>✅</Text>
              <Text style={styles.modalTitle}>הנתונים עודכנו!</Text>
              <TouchableOpacity style={[styles.primaryBtn, {width: '100%'}]} onPress={() => { setShowSuccessModal(false); setScreen('login'); }}>
                <Text style={styles.btnText}>יציאה למסך כניסה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (screen === 'developer') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeTitle}>מרכז הבקרה של גזית</Text>
        <Text style={styles.sectionTitle}>משתמשים רשומים ({registeredUsers.length})</Text>
        <ScrollView style={styles.userList}>
          {registeredUsers.map(u => (
            <View key={u.id} style={styles.userCard}>
              <TouchableOpacity onPress={() => removeUser(u.id)} style={styles.deleteBtn}>
                <Text style={{color: '#fff', fontSize: 12}}>🗑️</Text>
              </TouchableOpacity>
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{u.name}</Text>
                <Text style={{color: '#888', fontSize: 12}}>{u.phone} | {u.street}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>דיווחים ממשתמשים:</Text>
        <ScrollView style={{height: 100, backgroundColor: '#111', borderRadius: 10, padding: 10, marginBottom: 20}}>
          {incomingReports.length === 0 ? <Text style={{color: '#555', textAlign: 'right'}}>אין הודעות</Text> : 
            incomingReports.map(r => <View key={r.id} style={styles.reportCard}><Text style={{color: '#e74c3c'}}>{r.user}:</Text><Text style={{color: '#fff'}}>{r.msg}</Text></View>)
          }
        </ScrollView>

        <View style={styles.statusBox}>
          <Text style={styles.label}>סיסמת מדווח:</Text>
          <TextInput style={styles.smallInput} value={reporterPass} onChangeText={setReporterPass} />
          <Text style={styles.label}>סיסמת מפתח:</Text>
          <TextInput style={styles.smallInput} value={developerPass} onChangeText={setDeveloperPass} />
          <TouchableOpacity style={styles.updateBtn} onPress={() => Alert.alert("עודכן", "הסיסמאות נשמרו")}><Text style={styles.btnText}>שמור שינויים</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setScreen('login')} style={styles.logoutBtn}><Text style={{color: '#fff'}}>יציאה</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 30 },
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 50 },
  mainTitle: { color: '#e74c3c', fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  subTitle: { color: '#888', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, textAlign: 'right' },
  primaryBtn: { backgroundColor: '#27ae60', padding: 18, borderRadius: 12 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  toggleText: { color: '#3498db', textAlign: 'center', marginVertical: 15 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  roleTab: { padding: 10, borderBottomWidth: 2, borderBottomColor: '#333' },
  activeTab: { borderBottomColor: '#e74c3c' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 20 },
  welcomeTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'right' },
  dateTimeText: { color: '#888', fontSize: 14, textAlign: 'right' },
  menuBtn: { padding: 5 },
  menuLine: { width: 25, height: 3, backgroundColor: '#fff', marginVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 130, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15, padding: 10 },
  cardT: { color: '#aaa', fontSize: 11, textAlign: 'center', marginBottom: 5 },
  cardV: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  sidebar: { flex: 1, backgroundColor: '#111', width: '75%', padding: 30, paddingTop: 60 },
  menuItem: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  menuText: { color: '#fff', fontSize: 18, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a1a1a', padding: 25, borderRadius: 20, width: '100%' },
  successCard: { backgroundColor: '#1a1a1a', padding: 30, borderRadius: 25, width: '90%', alignItems: 'center', borderWidth: 1, borderColor: '#27ae60' },
  modalTitle: { color: '#fff', fontSize: 22, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
  textArea: { backgroundColor: '#0a0a0a', color: '#fff', padding: 15, borderRadius: 10, height: 100, textAlign: 'right', marginBottom: 15 },
  sectionTitle: { color: '#e74c3c', fontSize: 18, marginVertical: 10, textAlign: 'right' },
  reportCard: { borderBottomWidth: 1, borderBottomColor: '#222', paddingVertical: 8, alignItems: 'flex-end' },
  statusBox: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 15 },
  smallInput: { backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 8, textAlign: 'center', marginBottom: 10 },
  updateBtn: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 10 },
  label: { color: '#eee', textAlign: 'right', marginBottom: 5 },
  logoutBtn: { marginTop: 20, alignItems: 'center' },
  userList: { height: 150, backgroundColor: '#111', borderRadius: 10, padding: 10, marginBottom: 20 },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  deleteBtn: { backgroundColor: '#c0392b', padding: 8, borderRadius: 8 }
});