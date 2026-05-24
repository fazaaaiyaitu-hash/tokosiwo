// GANTI dengan konfigurasi Firebase project-mu!
const firebaseConfig = {
    apiKey: "AIzaSyBvjdO78HslTn9RHM4-tLsdQbJyKsSsxJk",
    authDomain: "website-5fe39.firebaseapp.com",
    projectId: "website-5fe39",
    storageBucket: "website-5fe39.firebasestorage.app",
    messagingSenderId: "243807840965",
    appId: "G-C2V2JBT1BT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();