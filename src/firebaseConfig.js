// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics"; // Podemos remover esta linha por enquanto, se não estivermos usando analytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb51nuHFFs70udGu2S9vjGClucP7fyty0",
  authDomain: "calories-counter-e8177.firebaseapp.com",
  projectId: "calories-counter-e8177",
  storageBucket: "calories-counter-e8177.firebasestorage.app",
  messagingSenderId: "147576906691",
  appId: "1:147576906691:web:9725e7b9ab5986ad8f9376",
  measurementId: "G-MPNKJ8NT4R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Inicializa o Firestore
const auth = getAuth(app);     // Inicializa a autenticação
const provider = new GoogleAuthProvider(); // Cria o provider para o Google

export { app, db, auth, provider, collection, addDoc, getDocs, query, where, doc, deleteDoc, signInWithPopup, signOut };