import { useState, useRef, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { Analytics } from '@vercel/analytics/react';

// ─── FIREBASE ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDbnMVzNieyZkke6PQ9LzBqQna9SlZU4Dg",
  authDomain: "tvhindelang-fussball.firebaseapp.com",
  databaseURL: "https://tvhindelang-fussball-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tvhindelang-fussball",
  storageBucket: "tvhindelang-fussball.firebasestorage.app",
  messagingSenderId: "719897877586",
  appId: "1:719897877586:web:de42747cfe009aa2c7138b"
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db      = getFirestore(firebaseApp);
const auth    = getAuth(firebaseApp);

const secondaryApp = getApps().find(a => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// ─── BRAND ───────────────────────────────────────────────────
const B = {
  teal:"#29B8C8", tealDark:"#1E96A4", tealLight:"#E8F7F9", tealMid:"#B8E8ED",
  anthracite:"#1C1C1C", charcoal:"#2E3A3D", midGrey:"#8A9BA0",
  lightGrey:"#E2EAEC", offWhite:"#F4F7F8", white:"#FFFFFF",
  red:"#E03E3E", redLight:"#FDEAEA", amber:"#E07A2A", amberLight:"#FEF3E8",
  green:"#2EAA6E", greenLight:"#E6F7F0",
};
const BUS = { color:"#7C3AED", bg:"#F3EFFE", border:"#C4B5FD" };

const EVENT_TYPES = [
  { value:"training", label:"Training",    color:B.teal,    bg:B.tealLight  },
  { value:"game",     label:"Spiel",       color:B.red,     bg:B.redLight   },
  { value:"meeting",  label:"Versammlung", color:B.amber,   bg:B.amberLight },
  { value:"other",    label:"Sonstiges",   color:B.midGrey, bg:B.offWhite   },
];
const DAYS   = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const typeOf = (v) => EVENT_TYPES.find(t=>t.value===v)||EVENT_TYPES[3];

const INIT_TEAMS = []; 
const INIT_INTRO = "Die Fußballabteilung des TV Hindelang e.V. vereint alle aktiven Mannschaften. Hier findet ihr Termine, Spielpläne und Vereinsnews an einem Ort.";

const emptyEvent = (date="") => ({ type:"training", title:"", date, time:"17:00", endTime:"", location:"", notes:"", team:"Herren", bus1:false, bus2:false, declines: [] });
const emptyTeamForm = () => ({ name: "", trainers: [{ name: "", phone: "" }], training: "", jahrgang: "" });

const LBL = { fontSize:11, fontWeight:700, letterSpacing:1, color:B.midGrey, textTransform:"uppercase", display:"block", marginBottom:5 };

const PineLogo = ({ size=36 }) => (
  <svg width={size} height={size*1.1} viewBox="0 0 80 88" fill="none">
    <path d="M40 4 L76 28 L64 84 L16 84 L4 28 Z" fill={B.teal}/>
    <path d="M40 18 L32 34 H36 L29 48 H34 L25 64 H55 L46 48 H51 L44 34 H48 Z" fill="white"/>
    <rect x="36" y="64" width="8" height="8" fill="white"/>
  </svg>
);


const VereinsLogo = ({ size=40 }) => {
  // HIER ZWISCHEN DIE ANFÜHRUNGSZEICHEN FÜGST DU DEINEN BASE64-TEXT EIN:
  const logoCode = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4RCcRXhpZgAATU0AKgAAAAgABAE7AAIAAAAOAAAISodpAAQAAAABAAAIWJydAAEAAAAcAAAQeOocAAcAAAgMAAAAPgAAAAAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFJhcGhhZWwgV2VjaHMAAAHqHAAHAAAIDAAACGoAAAAAHOoAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFIAYQBwAGgAYQBlAGwAIABXAGUAYwBoAHMAAAD/4QpmaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49J++7vycgaWQ9J1c1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCc/Pg0KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIvPjxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSJ1dWlkOmZhZjViZGQ1LWJhM2QtMTFkYS1hZDMxLWQzM2Q3NTE4MmYxYiIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj48ZGM6Y3JlYXRvcj48cmRmOlNlcSB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxyZGY6bGk+UmFwaGFlbCBXZWNoczwvcmRmOmxpPjwvcmRmOlNlcT4NCgkJCTwvZGM6Y3JlYXRvcj48L3JkZjpEZXNjcmlwdGlvbj48L3JkZjpSREY+PC94OnhtcG1ldGE+DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9J3cnPz7/2wBDAAcFBQYFBAcGBQYIBwcIChELCgkJChUPEAwRGBUaGRgVGBcbHichGx0lHRcYIi4iJSgpKywrGiAvMy8qMicqKyr/2wBDAQcICAoJChQLCxQqHBgcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKir/wAARCAFxAo0DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6RooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooqC8vbfT7R7m9mSGGMZZ3OAKNxNpK7JyQoJJwB1Jrmrr4h+F7O8NtNq0XmKcHYCwB9yOK8v8dfE+41tpNP0Nmt9P8AuvJ0eb/AV53Xr0Mu5o3qOx87is6UJ8tBX83+h9ZWV9a6jarc2FxHcQv9142yDU9fM3hTxlqXhK98yzfzLdz+9tnPyv7+x969/wDDPinTfFOnC506X5xxLC3Dxn3H9a5MThJ0HfdHoYLMaeKXK9Jdv8jaooorjPTCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiuS8Z+P9P8ACluYgRc6gwylup6e7HsKuEJVJcsVqZVasKMHObsjX8Q+JNO8Nac13qcwQdEjHLSH0ArwLxf441HxbdHz2MFkh/dWynge59TWTrWuX/iDUXvdUnMsrdB/Cg9AOwrPr6DDYONH3pas+Px2ZTxL5I6R/P1Ciium0Hwpc6v4X1nU4oWYWka+UcfeIYFse4UH867JTUFdnmU6cqkuWK/pHM1d0nV77RNQS80y4aCZO6ngj0I7iqVFNpNWZMZOLutz6G8E/EWx8UxLbXO211JR80RPyye6n+ldnXyTFLJBKssLtHIhyrKcEH1Br2HwJ8VkufL0zxM6xy8LHdnhW9m9D714mKwLj79LbsfU4DNlO1Ovo+/f1PVaKQEMoKnIPQilryj6EKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoooo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jhVsuevJ61J4FtbnRPGPiDSLqeS63eXcrO6bfMyPmPHHVv0rtnyOk4Qd7Wf+b/E8qn7RV41KkWnK66bWul+H3nfUUUVwHsGF42vPsPgnVZgcN9nZVP8AtEYH6mpfCVmNP8H6XbAYK2yEj0JG4/qawPitceX4TjtyG23F1Gr7VLEKDuJwPpV3TfH+gXl1bWFk11vkZYowbVwPQckcV1ezk6C5V1Z57q044p87tZJL5v8A4Y6qiiiuU9AR22IzHsM1xnw0H2jT9V1Q4P27UJHU46qDx/Oui8RXTWPhrUblAxaK3dlC9ScVw3g3xvoOheErDTrlrpZ4kPmAWrn5ixPXHvXVThKVKXKr6o4K1WEMRDndkk3+S/zPS6Kjt5kubaKeLOyVA65GDgjI4qSuU79wooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAGCKMSFxGoc9WC8mn0UUAFFFFACOiyKVkUMp6hhkUiIka7Y1VV9FGBTqKACiiigApghiWQuI0DnqwUZP40+igAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Z";

  return (
    <img 
      src={logoCode} 
      alt="TV Hindelang Logo" 
      style={{ height: size, width: "auto", objectFit: "contain" }} 
    />
  );
};



const Chip = ({ bg, c, border, children }) => (
  <span style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",background:bg,color:c,border:border||"none"}}>{children}</span>
);

// ─── DER TITAN-SCHUTZSCHILD FÜR DATEN ───
const safeStr = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'string') return val;
  try { return String(val); } catch (e) { return ""; }
};

const getTrainerNames = (team) => {
  if (team?.trainers && Array.isArray(team.trainers) && team.trainers.length > 0) {
    return team.trainers.map(tr => safeStr(tr?.name)).filter(Boolean).join(", ") || "N.N.";
  }
  return safeStr(team?.trainer) || "N.N.";
};

const safeDateObj = (dateString) => {
  if (!dateString) return { day: "?", month: "???", year: "????" };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { day: "?", month: "???", year: "????" };
  return { day: d.getDate(), month: MONTHS[d.getMonth()] ? MONTHS[d.getMonth()].slice(0,3).toUpperCase() : "???", year: d.getFullYear() };
};

// ─── DATENBANK-TRICK (BILD ZU TEXT UMWANDELN OHNE STORAGE) ───
const compressImageToBase64 = (file, maxWidth = 800, maxHeight = 800, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const fallbackTimer = setTimeout(() => reject(new Error("Zeitüberschreitung")), 4000);
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file); 
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.width; let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio; height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        clearTimeout(fallbackTimer);
        resolve(dataUrl);
      };
      img.onerror = () => { clearTimeout(fallbackTimer); URL.revokeObjectURL(objectUrl); reject(new Error("Ladefehler")); };
      img.src = objectUrl;
    } catch (e) { clearTimeout(fallbackTimer); reject(e); }
  });
};

// ─── MAIN ────────────────────────────────────────────────────
export default function TVHindelangApp() {
  const [user, setUser]           = useState(null);  
  const [userRole, setUserRole]   = useState(null);  
  const [authLoading, setAuthLoading] = useState(true);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName]   = useState("");
  const [loginError, setLoginError]       = useState("");
  const [loginLoading, setLoginLoading]   = useState(false);

  const [events, setEvents]   = useState([]);
  const [teams, setTeams]     = useState(INIT_TEAMS);
  const [news, setNews]       = useState([]);
  const [threads, setThreads] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [introText, setIntroText] = useState(INIT_INTRO);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [view, setView]             = useState("home");
  const [filterTeam, setFilterTeam] = useState("Alle Mannschaften");
  const [filterEventType, setFilterEventType] = useState("all"); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [adminSection, setAdminSection] = useState("teams");

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent]     = useState(null);
  const [eventForm, setEventForm]           = useState(emptyEvent());
  
  const [showNewsModal, setShowNewsModal]   = useState(false);
  const [editingNews, setEditingNews]       = useState(null);
  const [newsForm, setNewsForm]             = useState({ title:"", body:"", fileUrl:"", fileName:"", fileObj:null });
  const [newsSaving, setNewsSaving]         = useState(false);

  const [showTeamModal, setShowTeamModal]   = useState(false);
  const [editingTeam, setEditingTeam]       = useState(null);
  const [teamForm, setTeamForm]             = useState(emptyTeamForm());
  
  const [showNewThread, setShowNewThread]   = useState(false);
  const [newThreadType, setNewThreadType]   = useState("group");
  const [newThreadTeam, setNewThreadTeam]   = useState("Herren");
  const [newThreadRecipientId, setNewThreadRecipientId] = useState(""); 

  const [showUserModal, setShowUserModal]   = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [editingUser, setEditingUser]       = useState(null);
  const [userForm, setUserForm]             = useState({ name: "", email: "", password: "", role: "player", assignedTeams: [] });
  const [userSaving, setUserSaving]         = useState(false);
  const [userError, setUserError]           = useState("");

  const [activeThread, setActiveThread] = useState(null);
  const [chatInput, setChatInput]       = useState("");
  const chatEndRef = useRef(null);
  const csvInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const isAdmin = userRole === "admin";
  const isTrainer = userRole === "trainer";
  const canAccessAdmin = isAdmin || isTrainer; 
  const canEditEvents = isAdmin || isTrainer;  
  const canEditNews = isAdmin || isTrainer;    

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startOffset = (() => { const d=new Date(year,month,1).getDay(); return d===0?6:d-1; })();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const todayStr = new Date().toISOString().slice(0,10);

  const uniqueTeams = Array.from(new Set([
    ...(teams || []).map(t => safeStr(t?.name)).filter(Boolean),
    ...(events || []).map(e => safeStr(e?.team)).filter(Boolean)
  ])).sort((a,b) => a.localeCompare(b));
  
  const teamNames = ["Alle Mannschaften", ...uniqueTeams];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) setUserRole(snap.data().role || "player");
          else setUserRole("player");
        } catch { setUserRole("player"); }
      } else {
        setUser(null); setUserRole(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];
    unsubs.push(onSnapshot(query(collection(db,"events"), orderBy("date")), snap => setEvents(snap.docs.map(d=>({id:d.id,...d.data()})))));
    unsubs.push(onSnapshot(collection(db,"teams"), snap => setTeams(snap.docs.map(d=>({id:d.id,...d.data()})))));
    unsubs.push(onSnapshot(query(collection(db,"news"), orderBy("date","desc")), snap => setNews(snap.docs.map(d=>({id:d.id,...d.data()})))));
    unsubs.push(onSnapshot(collection(db,"threads"), snap => setThreads(snap.docs.map(d=>({id:d.id,...d.data(),messages:d.data().messages||[]})))));
    unsubs.push(onSnapshot(collection(db,"users"), snap => setAllUsers(snap.docs.map(d=>({id:d.id,...d.data()})))));
    unsubs.push(onSnapshot(doc(db,"settings","intro"), snap => { if (snap.exists()) setIntroText(snap.data().text || INIT_INTRO); }));
    setDataLoaded(true);
    return () => unsubs.forEach(u=>u());
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [activeThread]);

  const handleLogin = async () => {
    setLoginLoading(true); setLoginError("");
    try { await signInWithEmailAndPassword(auth, loginEmail, loginPassword); setLoginEmail(""); setLoginPassword(""); } 
    catch (e) { setLoginError("Falsche E-Mail oder falsches Passwort."); }
    setLoginLoading(false);
  };

  const handleRegister = async () => {
    setLoginLoading(true); setLoginError("");
    if (!registerName.trim()) { setLoginError("Bitte gib deinen Namen an."); setLoginLoading(false); return; }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      await setDoc(doc(db, "users", userCredential.user.uid), { email: loginEmail, name: registerName, role: "player", assignedTeams: [], createdAt: serverTimestamp() });
      setLoginEmail(""); setLoginPassword(""); setRegisterName("");
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setLoginError("Diese E-Mail ist bereits registriert.");
      else if (e.code === 'auth/weak-password') setLoginError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      else setLoginError("Fehler: " + e.message);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); setView("home"); };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) { alert("Datei leer oder ohne Überschriften."); setIsImporting(false); return; }

      let delimiter = lines[0].includes("\t") ? "\t" : (lines[0].split(";").length > lines[0].split(",").length ? ";" : ",");
      const parseRow = (rowStr) => {
        const result = []; let current = ''; let inQuotes = false;
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"' && rowStr[i+1] === '"') { current += '"'; i++; } 
          else if (char === '"') inQuotes = !inQuotes; 
          else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; } 
          else current += char;
        }
        result.push(current.trim());
        return result.map(v => safeStr(v).replace(/^"|"$/g, '').trim()); 
      };

      const headers = parseRow(lines[0]).map(h => safeStr(h).toLowerCase());
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]); const row = {};
        headers.forEach((header, index) => { row[header] = values[index] || ""; });
        const getVal = (exactMatches) => { let key = headers.find(h => exactMatches.includes(h)); return key ? row[key] : ""; };

        let rawDate = getVal(["spieldatum", "datum", "date"]); let rawTime = getVal(["uhrzeit", "zeit", "anstoßzeit"]);
        let heim = getVal(["heimmannschaft", "heim"]); let gast = getVal(["gastmannschaft", "gast", "gegner"]);
        let ort = getVal(["ort", "stadt"]); let spielstaette = getVal(["spielstätte", "spielstaette"]);
        let mannschaftsart = getVal(["mannschaftsart", "team", "mannschaft"]); let staffel = getVal(["staffel", "liga"]);
        let typ = getVal(["spielkennung", "spielart", "typ", "spieltyp", "wettbewerb"]);

        if (!rawDate || !heim || !gast) continue; 
        let cleanDate = safeStr(rawDate).replace(/^[a-zA-ZäöüßÄÖÜ]{2}\.?\s*/, ''); let formattedDate = "";
        const deMatch = cleanDate.match(/(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/); const isoMatch = cleanDate.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);      
        if (isoMatch) { formattedDate = `${isoMatch[1]}-${isoMatch[2].padStart(2,'0')}-${isoMatch[3].padStart(2,'0')}`; } 
        else if (deMatch) { let d = deMatch[1].padStart(2, '0'); let m = deMatch[2].padStart(2, '0'); let y = deMatch[3] ? (deMatch[3].length === 2 ? '20' + deMatch[3] : deMatch[3]) : new Date().getFullYear().toString(); formattedDate = `${y}-${m}-${d}`; } 
        else continue; 
        if (isNaN(new Date(formattedDate).getTime())) continue;

        let formattedTime = "12:00"; 
        if (rawTime) { let tClean = safeStr(rawTime).replace(".", ":").trim(); const tMatch = tClean.match(/(\d{1,2}):(\d{2})/); if (tMatch) formattedTime = `${tMatch[1].padStart(2, '0')}:${tMatch[2]}`; }
        let fullLocation = [spielstaette, ort].filter(Boolean).join(", ") || "Ort unbekannt";
        let title = `${heim} vs. ${gast}`; let teamNameRaw = safeStr(mannschaftsart || "Verein"); 
        if (safeStr(heim).toLowerCase().includes("hindelang") || safeStr(heim).toLowerCase().includes("tvh") || safeStr(heim).toLowerCase().includes("tv ")) { title = `Heimspiel vs. ${gast}`; } 
        else if (safeStr(gast).toLowerCase().includes("hindelang") || safeStr(gast).toLowerCase().includes("tvh") || safeStr(gast).toLowerCase().includes("tv ")) { title = `Auswärts bei ${heim}`; }

        let finalTeamName = teamNameRaw;
        let matchedTeam = teams.find(t => {
          const eName = safeStr(t?.name).toLowerCase().trim(); const iName = teamNameRaw.toLowerCase().trim();
          if (!eName) return false;
          return eName === iName || eName.replace("jugend", "junioren") === iName || eName.replace("junioren", "jugend") === iName || eName.replace("mädchen", "juniorinnen") === iName || eName.replace("juniorinnen", "mädchen") === iName || eName.replace("-", " ") === iName.replace("-", " ") || eName.replace("-", "") === iName.replace("-", "");
        });
        if (matchedTeam) finalTeamName = matchedTeam.name; else finalTeamName = teamNameRaw.replace(/Junioren/g, "Jugend").replace(/Juniorinnen/g, "Mädchen");

        let extraInfos = []; if(typ) extraInfos.push(typ); if(staffel) extraInfos.push(`Staffel: ${staffel}`);
        let notesText = extraInfos.join(" | ") || "Automatisch importiert";

        await addDoc(collection(db, "events"), { type: "game", title, date: formattedDate, time: formattedTime, endTime: "", location: fullLocation, notes: notesText, team: finalTeamName, bus1: false, bus2: false, declines: [], createdAt: serverTimestamp() });
        count++;
      }
      alert(`${count} Spiele importiert!`); setIsImporting(false); if (csvInputRef.current) csvInputRef.current.value = ""; 
    };
    reader.readAsText(file, "windows-1252");
  };

  const shareEventWhatsApp = (ev) => {
    const d = new Date(ev.date); const dateStr = !isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth()+1).padStart(2, '0')}.` : ev.date;
    const text = `⚽ *Neuer Termin: ${ev.title}*\n📅 ${dateStr}, ${ev.time} Uhr\n📍 ${ev.location || "Heim"}\n👥 ${ev.team}\n\n👉 Bitte in der TVH App prüfen!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareNewsWhatsApp = (n) => {
    const text = `📢 *TVH News: ${n.title}*\n\n${n.body}\n\n👉 Jetzt in der TVH App ansehen!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleDecline = async (ev) => {
    if (!user) return;
    const myProfile = allUsers.find(u => u.id === user.uid); const myName = myProfile?.name || user.email; 
    let newDeclines = Array.isArray(ev.declines) ? [...ev.declines] : [];
    if (newDeclines.includes(myName)) newDeclines = newDeclines.filter(n => n !== myName); else newDeclines.push(myName); 
    await updateDoc(doc(db, "events", ev.id), { declines: newDeclines });
  };

  const openAddEvent = (date="") => { setEditingEvent(null); setEventForm(emptyEvent(date)); setShowEventModal(true); };
  const openEditEvent = (ev) => { setEditingEvent(ev); setEventForm({type:ev.type,title:ev.title,date:ev.date,time:ev.time,endTime:ev.endTime||"",location:ev.location||"",notes:ev.notes||"",team:ev.team||"Herren",bus1:ev.bus1||false,bus2:ev.bus2||false,declines:ev.declines||[], isRecurring: false, recurringEndDate: ""}); setShowEventModal(true); };
  
  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.date) return;
    if (editingEvent) {
      const updatedData = { ...eventForm }; delete updatedData.isRecurring; delete updatedData.recurringEndDate;
      await updateDoc(doc(db, "events", editingEvent.id), updatedData);
    } else {
      if (eventForm.isRecurring && eventForm.recurringEndDate) {
        let currentDateObj = new Date(eventForm.date); const endDateObj = new Date(eventForm.recurringEndDate); let loopCount = 0; 
        while (currentDateObj <= endDateObj && loopCount < 52) { 
          const isoDate = currentDateObj.toISOString().slice(0, 10); const newEvent = { ...eventForm, date: isoDate, createdAt: serverTimestamp() };
          delete newEvent.isRecurring; delete newEvent.recurringEndDate; await addDoc(collection(db, "events"), newEvent);
          currentDateObj.setDate(currentDateObj.getDate() + 7); loopCount++;
        }
      } else {
        const newEvent = { ...eventForm, createdAt: serverTimestamp() }; delete newEvent.isRecurring; delete newEvent.recurringEndDate;
        await addDoc(collection(db, "events"), newEvent);
      }
    }
    setShowEventModal(false);
  };
  
  const deleteEvent = async (id) => { if (window.confirm("Möchtest du diesen Termin wirklich löschen?")) await deleteDoc(doc(db,"events",id)); };

  const openAddNews = () => { setEditingNews(null); setNewsForm({title:"", body:"", fileUrl:"", fileName:"", fileObj:null}); setShowNewsModal(true); };
  const openEditNews = (n) => { setEditingNews(n); setNewsForm({title:n.title, body:n.body, fileUrl:n.fileUrl||"", fileName:n.fileName||"", fileObj:null}); setShowNewsModal(true); };
  
  // NUR BILDER, SPEICHERN ALS BASE64 IN FIRESTORE
  const saveNews = async () => {
    if (!newsForm.title || !newsForm.body) return;
    setNewsSaving(true);
    let finalFileUrl = newsForm.fileUrl || ""; let finalFileName = newsForm.fileName || "";
    
    if (newsForm.fileObj) {
      if (!newsForm.fileObj.type.startsWith('image/')) {
        alert("Bitte wähle nur ein Bild (JPG, PNG) aus. Dokumente sind hier nicht erlaubt.");
        setNewsSaving(false); return;
      }
      try {
        finalFileUrl = await compressImageToBase64(newsForm.fileObj);
        finalFileName = newsForm.fileObj.name;
        if (finalFileUrl.length > 900000) { alert("Dieses Bild ist trotz Komprimierung zu groß. Bitte wähle ein anderes."); setNewsSaving(false); return; }
      } catch (err) { alert("Fehler bei der Bildverarbeitung."); setNewsSaving(false); return; }
    }

    const newsData = { title: newsForm.title, body: newsForm.body, fileUrl: finalFileUrl, fileName: finalFileName };
    try {
      if (editingNews) await updateDoc(doc(db,"news",editingNews.id), newsData);
      else await addDoc(collection(db,"news"), { ...newsData, date:todayStr, author: user?.email||"Admin", createdAt:serverTimestamp() });
      setShowNewsModal(false);
    } catch (e) { alert("Datenbank-Fehler: " + e.message); }
    setNewsSaving(false); 
  };

  const deleteNews = async (id) => { if (window.confirm("Möchtest du diese News wirklich löschen?")) await deleteDoc(doc(db,"news",id)); };

  const openAddTeam  = () => { setEditingTeam(null); setTeamForm(emptyTeamForm()); setShowTeamModal(true); };
  const openEditTeam = (t) => { 
    setEditingTeam(t); let loadedTrainers = Array.isArray(t?.trainers) ? t.trainers : [];
    if (loadedTrainers.length === 0 && t?.trainer) { loadedTrainers = [{ name: t.trainer, phone: "" }]; } else if (loadedTrainers.length === 0) { loadedTrainers = [{ name: "", phone: "" }]; }
    setTeamForm({ name: t?.name || "", trainers: loadedTrainers, training: t?.training || "", jahrgang: t?.jahrgang || "" }); setShowTeamModal(true); 
  };
  const saveTeam = async () => {
    if (!teamForm.name) return;
    const cleanTrainers = teamForm.trainers.filter(tr => safeStr(tr.name).trim() !== "");
    const finalData = { ...teamForm, trainers: cleanTrainers };
    if (editingTeam) await updateDoc(doc(db,"teams",editingTeam.id), finalData); else await addDoc(collection(db,"teams"), finalData);
    setShowTeamModal(false);
  };
  const deleteTeam = async (id) => { if (window.confirm("Möchtest du diese Mannschaft wirklich löschen?")) await deleteDoc(doc(db,"teams",id)); };

  const openAddUser = () => { setEditingUser(null); setUserError(""); setUserForm({ name: "", email: "", password: "", role: "player", assignedTeams: [] }); setShowUserModal(true); };
  const openEditUser = (u) => { setEditingUser(u); setUserError(""); setUserForm({ name: u?.name || "", email: u?.email || "", password: "", role: u?.role || "player", assignedTeams: Array.isArray(u?.assignedTeams) ? u.assignedTeams : [] }); setShowUserModal(true); };
  const saveUser = async () => {
    setUserError(""); setUserSaving(true);
    try {
      if (editingUser) { await updateDoc(doc(db, "users", editingUser.id), { name: userForm.name, role: userForm.role, assignedTeams: userForm.assignedTeams }); } 
      else {
        if (!userForm.email || !userForm.password) { setUserError("E-Mail und Passwort sind Pflichtfelder für neue Nutzer."); setUserSaving(false); return; }
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userForm.email, userForm.password);
        await setDoc(doc(db, "users", userCredential.user.uid), { email: userForm.email, name: userForm.name, role: userForm.role, assignedTeams: userForm.assignedTeams, createdAt: serverTimestamp() });
        await signOut(secondaryAuth);
      }
      setShowUserModal(false);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setUserError("Diese E-Mail ist bereits registriert.");
      else if (err.code === 'auth/weak-password') setUserError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      else setUserError("Fehler: " + err.message);
    }
    setUserSaving(false);
  };
  const deleteUser = async (id) => { if (window.confirm("Möchtest du diesen Benutzer entfernen?")) await deleteDoc(doc(db,"users",id)); };

  const saveIntro = async (text) => { await setDoc(doc(db,"settings","intro"), { text }); };

  const openChat = async (th) => { setActiveThread(th); if (user && th?.id) { await updateDoc(doc(db, "threads", th.id), { [`readReceipts.${user.uid}`]: Date.now() }); } };

  const sendMessage = async () => {
    if (!chatInput.trim()||!activeThread) return;
    const myProfile = allUsers.find(u => u.id === user.uid); const senderName = myProfile?.name || user.email;
    const msg = { from: senderName, text: chatInput, time: new Date().toLocaleTimeString("de",{hour:"2-digit",minute:"2-digit"}), timestamp: Date.now() };
    const updated = [...(activeThread.messages||[]), msg];
    await updateDoc(doc(db,"threads",activeThread.id), { messages: updated, [`readReceipts.${user.uid}`]: Date.now() });
    setActiveThread({...activeThread, messages: updated}); setChatInput("");
  };

  const createThread = async () => {
    if (newThreadType === "group") {
      const ref = await addDoc(collection(db,"threads"), { type:"group", label:newThreadTeam, team:newThreadTeam, messages:[] });
      setActiveThread({ id:ref.id, type:"group", label:newThreadTeam, team:newThreadTeam, messages:[] });
    } else {
      const existing = threads.find(th => th?.type === "direct" && Array.isArray(th?.participants) && th.participants.includes(user.uid) && th.participants.includes(newThreadRecipientId));
      if (existing) { openChat(existing); } else {
        const ref = await addDoc(collection(db,"threads"), { type:"direct", participants: [user.uid, newThreadRecipientId], messages:[] });
        setActiveThread({ id:ref.id, type:"direct", participants: [user.uid, newThreadRecipientId], messages:[] });
      }
    }
    setShowNewThread(false); setNewThreadRecipientId("");
  };

  const visibleThreads = (threads || []).filter(th => {
    if (!th) return false;
    if (th.type === "group") {
      if (isAdmin) return true; const myProfile = allUsers.find(u => u.id === user?.uid);
      const myTeams = Array.isArray(myProfile?.assignedTeams) ? myProfile.assignedTeams : [];
      return myTeams.includes(th.team); 
    }
    if (th.type === "direct") return Array.isArray(th.participants) ? th.participants.includes(user?.uid) : false;
    return false;
  });

  const checkUnread = (th) => {
    if (!th || !Array.isArray(th.messages) || th.messages.length === 0) return false;
    const lastMsg = th.messages[th.messages.length - 1]; const myProfile = allUsers.find(u => u.id === user?.uid);
    if (lastMsg.from === (myProfile?.name || user?.email)) return false; 
    if (!lastMsg.timestamp) return false; 
    const myLastRead = th.readReceipts?.[user?.uid] || 0; return lastMsg.timestamp > myLastRead;
  };
  const totalUnreadCount = visibleThreads.filter(checkUnread).length;

  const matchesFilter = (ev) => {
    if (!ev) return false;
    const teamMatch = filterTeam === "Alle Mannschaften" || safeStr(ev.team) === safeStr(filterTeam);
    const typeMatch = filterEventType === "all" || safeStr(ev.type) === safeStr(filterEventType);
    return teamMatch && typeMatch;
  };
  
  const getDay = (day) => { const d=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return events.filter(e=>e?.date===d&&matchesFilter(e)); };
  const selectedStr = selectedDay ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : "";
  const selectedEvs = selectedDay ? (events||[]).filter(e=>e?.date===selectedStr&&matchesFilter(e)).sort((a,b)=>safeStr(a?.time).localeCompare(safeStr(b?.time))) : [];
  const upcoming    = [...(events||[])].filter(e=>safeStr(e?.date)>=todayStr&&matchesFilter(e)).sort((a,b)=>safeStr(a?.date).localeCompare(safeStr(b?.date))||safeStr(a?.time).localeCompare(safeStr(b?.time))).slice(0,10);
  const nextThree   = [...(events||[])].filter(e=>safeStr(e?.date)>=todayStr).sort((a,b)=>safeStr(a?.date).localeCompare(safeStr(b?.date))||safeStr(a?.time).localeCompare(safeStr(b?.time))).slice(0,3);

  const NAV = [
    { id:"home",     icon:"🏠", label:"Start"        },
    { id:"calendar", icon:"📅", label:"Kalender"     },
    { id:"schedule", icon:"📋", label:"Spielplan"    },
    { id:"teams",    icon:"👥", label:"Teams"        },
    { id:"messages", icon:"💬", label:"Chats", badge: totalUnreadCount > 0 },
  ];

const EventCard = ({ ev, controls=true, showDate=false, onClick=null }) => {
    if (!ev) return null;
    const t=typeOf(ev.type); const hasBus=ev.bus1||ev.bus2;
    const myProfile = allUsers.find(u => u.id === user?.uid); const myName = myProfile?.name || user?.email;
    const hasDeclined = Array.isArray(ev.declines) && ev.declines.includes(myName);
    const isNew = ev.createdAt?.toDate ? ev.createdAt.toDate() > new Date(Date.now() - 48 * 60 * 60 * 1000) : false;
    const myTeams = Array.isArray(myProfile?.assignedTeams) ? myProfile.assignedTeams : [];
    const canDecline = isAdmin || isTrainer || myTeams.includes(ev.team);
    const sd = safeDateObj(ev.date); // Holt das formatierte Datum

    return (
      <div 
        style={{borderLeft:`3px solid ${hasBus?BUS.color:t.color}`,background:hasBus?BUS.bg:t.bg,borderRadius:"0 8px 8px 0",padding:"11px 13px",marginBottom:10, cursor: onClick ? "pointer" : "default", transition: "transform .15s"}}
        onClick={onClick ? () => onClick(ev) : undefined}
      >
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}} className="event-card-inner">
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {isNew && <Chip bg={B.amberLight} c={B.amber}>NEU</Chip>}
              <Chip bg={t.color+"22"} c={t.color}>{t.label}</Chip>
              {ev.team&&<Chip bg={B.anthracite+"11"} c={B.charcoal}>{safeStr(ev.team)}</Chip>}
              {ev.bus1&&<Chip bg={BUS.bg} c={BUS.color} border={`1px solid ${BUS.border}`}>🚌 Bus 1</Chip>}
              {ev.bus2&&<Chip bg={BUS.bg} c={BUS.color} border={`1px solid ${BUS.border}`}>🚌 Bus 2</Chip>}
            </div>
            <div style={{fontWeight:800,fontSize:15}}>{safeStr(ev.title)}</div>
            <div style={{fontSize:13,color:B.teal,fontWeight:700,marginTop:2}}>
              {showDate && <span>📅 {sd.day}. {sd.month} {sd.year} · </span>}
              ⏰ {safeStr(ev.time)} {ev.endTime ? `- ${safeStr(ev.endTime)}` : ""} Uhr
            </div>
            {ev.location&&<div style={{fontSize:12,color:B.midGrey,marginTop:1}}>📍 {safeStr(ev.location)}</div>}
            {ev.notes&&<div style={{fontSize:12,color:B.charcoal,marginTop:4,fontStyle:"italic",fontFamily:"'Barlow',sans-serif"}}>{safeStr(ev.notes)}</div>}
            {canEditEvents && Array.isArray(ev.declines) && ev.declines.length > 0 && (
              <div style={{marginTop: 8, padding: "6px 8px", background: B.redLight, borderRadius: 6, fontSize: 12, color: B.red, fontFamily:"'Barlow',sans-serif"}}>
                <strong>❌ {ev.declines.length} Absage(n):</strong> {ev.declines.filter(n=>typeof n==='string').join(", ")}
              </div>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0, alignItems:"flex-end"}} className="event-card-actions">
            {canDecline && (
              <button className="btn btn-ghost" style={{padding:"5px 10px", fontSize:11, color: hasDeclined ? B.charcoal : B.red, background: hasDeclined ? B.lightGrey : B.redLight}} onClick={(e)=>{e.stopPropagation(); toggleDecline(ev);}}>
                {hasDeclined ? "✅ Doch dabei" : "❌ Ich fehle"}
              </button>
            )}
            {canEditEvents&&controls&&(
              <div style={{display:"flex", gap:4, marginTop: 4}} className="event-card-admin-actions">
                <button className="btn btn-edit" style={{background:"#25D366", color:"white"}} onClick={(e)=>{e.stopPropagation(); shareEventWhatsApp(ev);}} title="In WhatsApp teilen">📲 WA</button>
                <button className="btn btn-edit" onClick={(e)=>{e.stopPropagation(); openEditEvent(ev);}}>✏️</button>
                <button className="btn btn-danger" onClick={(e)=>{e.stopPropagation(); deleteEvent(ev.id);}}>🗑️</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getAdminTabs = () => {
    const tabs = [];
    if (isAdmin) tabs.push({ id: "teams", label: "👥 Mannschaften" });
    if (canEditEvents) tabs.push({ id: "events", label: "📅 Termine" });
    if (canEditNews) tabs.push({ id: "news", label: "📢 News" });
    if (isAdmin) tabs.push({ id: "users", label: "👤 Benutzer" });
    if (isAdmin) tabs.push({ id: "intro", label: "🏠 Startseite" });
    return tabs;
  };

  if (authLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:B.offWhite,flexDirection:"column",gap:16}}>
      <PineLogo size={52}/>
      <div style={{fontSize:14,color:B.midGrey,fontFamily:"'Barlow',sans-serif"}}>Wird geladen…</div>
    </div>
  );

  if (!user) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:B.offWhite,fontFamily:"'Barlow Condensed',sans-serif", padding: 20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.input{background:#fff;border:1.5px solid ${B.lightGrey};color:${B.anthracite};border-radius:8px;padding:9px 13px;font-family:'Barlow',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s;}.input:focus{border-color:${B.teal};}.btn{border:none;border-radius:7px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:all .18s;}.btn-primary{background:${B.teal};color:white;padding:10px 22px;font-size:14px;}.btn-primary:hover{background:${B.tealDark};}.btn-primary:disabled{background:${B.lightGrey};color:${B.midGrey};cursor:not-allowed;}`}</style>
      <div style={{background:B.white,border:`1.5px solid ${B.lightGrey}`,borderRadius:16,padding:"40px 36px",width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,.1)"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28}}>
          <PineLogo size={52}/>
          <div style={{fontSize:22,fontWeight:900,letterSpacing:2,textTransform:"uppercase",marginTop:12}}>TV Hindelang</div>
          <div style={{fontSize:13,color:B.midGrey,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>
            {isRegisterMode ? "Registrierung" : "Fussball"}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {isRegisterMode && (
            <div>
              <label style={LBL}>Dein Name (Vor- & Nachname)</label>
              <input className="input" type="text" placeholder="Max Mustermann" value={registerName} onChange={e=>setRegisterName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
            </div>
          )}
          <div>
            <label style={LBL}>E-Mail</label>
            <input className="input" type="email" placeholder="deine@email.de" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(isRegisterMode?handleRegister():handleLogin())}/>
          </div>
          <div>
            <label style={LBL}>Passwort</label>
            <input className="input" type="password" placeholder={isRegisterMode ? "Mindestens 6 Zeichen" : "••••••••"} value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(isRegisterMode?handleRegister():handleLogin())}/>
          </div>
          {loginError&&<div style={{color:B.red,fontSize:13,fontFamily:"'Barlow',sans-serif"}}>❌ {loginError}</div>}
          <button className="btn btn-primary" style={{marginTop:4}} onClick={isRegisterMode ? handleRegister : handleLogin} disabled={loginLoading||!loginEmail||!loginPassword||(isRegisterMode&&!registerName)}>
            {loginLoading ? "Bitte warten..." : (isRegisterMode ? "Konto erstellen" : "Einloggen")}
          </button>
        </div>
        <div style={{marginTop:24,fontSize:13,color:B.teal,fontWeight:700,fontFamily:"'Barlow',sans-serif",textAlign:"center",cursor:"pointer",textDecoration:"underline"}} onClick={() => { setIsRegisterMode(!isRegisterMode); setLoginError(""); }}>
          {isRegisterMode ? "Bereits ein Konto? Hier einloggen" : "Noch kein Konto? Hier registrieren"}
        </div>
      </div>
    </div>
  );
  return (
    <div className="app-container" style={{fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",background:B.offWhite,color:B.anthracite}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html, body { height: 100%; width: 100%; margin: 0; padding: 0; }
        .app-container { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
        .main-wrapper { flex: 1; overflow-y: auto; padding: 28px 24px; }
        .hide-scroll { overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .nav-btn { position:relative; background:none;border:none;cursor:pointer;padding:13px 15px;color:${B.midGrey};font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-bottom:3px solid transparent;transition:all .2s;display:flex;align-items:center;gap:6px;white-space:nowrap; }
        .nav-btn:hover { color:${B.teal}; } .nav-btn.active { color:${B.teal};border-bottom-color:${B.teal}; }
        .btn { border:none;border-radius:7px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:all .18s; }
        .btn-primary { background:${B.teal};color:white;padding:10px 22px;font-size:14px; } .btn-primary:hover{background:${B.tealDark};}
        .btn-primary:disabled { background:${B.lightGrey};color:${B.midGrey};cursor:not-allowed; }
        .btn-ghost { background:${B.lightGrey};color:${B.charcoal};padding:8px 16px;font-size:13px; } .btn-ghost:hover{background:#d0dadc;}
        .btn-edit { background:${B.tealLight};color:${B.teal};padding:6px 10px;font-size:12px; } .btn-edit:hover{background:${B.teal};color:white;}
        .btn-danger { background:${B.redLight};color:${B.red};padding:6px 10px;font-size:12px; } .btn-danger:hover{background:${B.red};color:white;}
        .card { background:${B.white};border:1.5px solid ${B.lightGrey};border-radius:10px; }
        .input { background:${B.white};border:1.5px solid ${B.lightGrey};color:${B.anthracite};border-radius:8px;padding:9px 13px;font-family:'Barlow',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s; } .input:focus{border-color:${B.teal};}
        select.input option { background:white; } textarea.input { resize:vertical;min-height:80px; } input[type="file"].input { padding: 6px 10px; font-size: 13px; }
        .modal-bg { position:fixed;inset:0;background:rgba(28,28,28,.5);display:flex;align-items:center;justify-content:center;z-index:2000;padding:20px;backdrop-filter:blur(4px); }
        .modal { background:${B.white};border-radius:14px;padding:30px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto; }
        .cal-day { min-height:64px;background:${B.white};border:1.5px solid ${B.lightGrey};border-radius:8px;padding:6px;cursor:pointer;transition:all .15s; }
        .cal-day:hover { border-color:${B.tealMid};background:#f0fbfc; } .cal-day.today{border-color:${B.teal};background:${B.tealLight};}
        .cal-day.selected { border-color:${B.teal};background:#dff2f5;box-shadow:0 0 0 2px ${B.tealMid}; } .cal-day.other-month{opacity:.2;pointer-events:none;}
        .event-bar { height:4px;border-radius:3px;margin:1px 0; }
        .tile { background:${B.white};border:1.5px solid ${B.lightGrey};border-radius:14px;padding:22px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;gap:12px; }
        .tile:hover { border-color:${B.teal};transform:translateY(-2px);box-shadow:0 8px 24px rgba(41,184,200,.1); }
        .team-card { background:${B.white};border:1.5px solid ${B.lightGrey};border-radius:10px;padding:18px 20px;cursor:pointer;transition:all .2s; }
        .team-card:hover { border-color:${B.teal};transform:translateY(-2px);box-shadow:0 6px 20px rgba(41,184,200,.1); }
        .chat-me { background:${B.teal};color:white;border-radius:14px 14px 2px 14px;padding:9px 14px;max-width:78%;align-self:flex-end;font-size:14px;font-family:'Barlow',sans-serif; }
        .chat-them { background:${B.white};border:1.5px solid ${B.lightGrey};border-radius:14px 14px 14px 2px;padding:9px 14px;max-width:78%;align-self:flex-start;font-size:14px;font-family:'Barlow',sans-serif; }
        .unread-dot { width: 10px; height: 10px; background: ${B.red}; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .pill { border:none;border-radius:20px;padding:6px 14px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;transition:all .15s; flex-shrink: 0;}
        .admin-tab { background:none;border:none;border-bottom:2px solid transparent;padding:10px 18px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${B.midGrey};transition:all .2s; white-space: nowrap;}
        .admin-tab:hover { color:${B.amber}; } .admin-tab.active{color:${B.amber};border-bottom-color:${B.amber};}
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cal-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; max-width: 1200px; margin: 0 auto; }
        .schedule-grid { display: grid; grid-template-columns: 64px 3px 1fr auto; gap: 14px; align-items: center; padding: 14px 18px; transition: border-color .2s; }
        .admin-list-item { display: grid; grid-template-columns: 160px 1fr 1fr 1fr auto; gap: 16px; align-items: center; padding: 14px 18px; }
        .chat-layout { display: grid; grid-template-columns: 270px 1fr; background: ${B.white}; border-radius: 12px; border: 1.5px solid ${B.lightGrey}; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.07); height: calc(100vh - 200px); min-height: 500px; }
        .bottom-nav { display: none; }
        .mobile-back-btn { display: none; }
        @media (max-width: 768px) {
          .main-wrapper { padding: 16px 16px 100px 16px; }
          .top-nav-links { display: none !important; }
          .header-right { margin-left: auto; }
          .bottom-nav { display: flex !important; position: fixed; bottom: 0; left: 0; width: 100%; background: ${B.white}; border-top: 1.5px solid ${B.lightGrey}; z-index: 9999; padding-bottom: max(12px, env(safe-area-inset-bottom)); justify-content: space-around; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); }
          .bottom-nav-item { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 0 8px 0; color: ${B.midGrey}; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: none; background: none; cursor: pointer; transition: color .2s;}
          .bottom-nav-item.active { color: ${B.teal}; }
          .bottom-nav-icon { font-size: 22px; margin-bottom: 2px; }
          .nav-badge-mobile { position: absolute; top: 6px; right: calc(50% - 14px); background: ${B.red}; width: 8px; height: 8px; border-radius: 50%; }
          .grid-2 { grid-template-columns: 1fr; }
          .cal-layout { grid-template-columns: 1fr; gap: 16px; }
          .cal-sidebar { order: -1; }
          .schedule-grid { grid-template-columns: 50px 3px 1fr; padding: 14px; position: relative; gap: 10px; }
          .schedule-actions { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 1px dashed ${B.lightGrey}; padding-top: 12px; flex-direction: row !important; }
          .event-card-inner { flex-direction: column; }
          .event-card-actions { width: 100%; flex-direction: row !important; justify-content: space-between; align-items: center !important; margin-top: 8px; border-top: 1px dashed ${B.lightGrey}; padding-top: 10px; }
          .event-card-admin-actions { margin-top: 0 !important; }
          .admin-list-item { grid-template-columns: 1fr; gap: 8px; padding: 16px; }
          .admin-list-actions { display: flex; gap: 8px; margin-top: 4px; padding-top: 10px; border-top: 1px dashed ${B.lightGrey}; }
          .admin-tabs-container { overflow-x: auto; padding-bottom: 5px; }
          .chat-layout { grid-template-columns: 1fr; height: calc(100vh - 180px); border-radius: 8px; }
          .chat-sidebar.mobile-hidden { display: none !important; }
          .chat-main.mobile-hidden { display: none !important; }
          .mobile-back-btn { display: block; background: none; border: none; font-size: 22px; cursor: pointer; margin-right: 12px; color: ${B.anthracite}; }
          .modal { padding: 20px; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{background:B.white,borderBottom:`2px solid ${B.lightGrey}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",cursor:"pointer"}} onClick={()=>{setView("home");setSelectedTeam(null);}}>
          <VereinsLogo size={40}/>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:12,fontWeight:800,color:B.teal,letterSpacing:2}}>TV</span>
              <span style={{fontSize:20,fontWeight:900,color:B.anthracite,letterSpacing:3,textTransform:"uppercase"}}>HINDELANG</span>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:B.teal,letterSpacing:3,textTransform:"uppercase",marginTop:-2}}>FUSSBALL</div>
          </div>
        </div>
        <nav className="top-nav-links" style={{display:"flex",alignItems:"center"}}>
          {NAV.map(({id,icon,label,badge})=>(
            <button key={id} className={`nav-btn ${view===id?"active":""}`} onClick={()=>{setView(id);setSelectedTeam(null);}}>
              <span>{icon}</span>{label}
              {badge && <div style={{position:"absolute", top: 12, right: 6, background: B.red, width: 8, height: 8, borderRadius: "50%"}} />}
            </button>
          ))}
          <div style={{width:1,height:28,background:B.lightGrey,margin:"0 8px"}}/>
          {canAccessAdmin&&(
            <button className={`nav-btn ${view==="admin"?"active":""}`} style={{color:B.amber}} onClick={()=>{ setView("admin"); if(isTrainer && !isAdmin && adminSection !== "events" && adminSection !== "news") setAdminSection("events"); }}>⚙️ Admin</button>
          )}
        </nav>
        <div className="header-right"><button className="btn btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={handleLogout}>Abmelden</button></div>
      </header>

      {/* ── FILTER BAR ── */}
      {(view==="calendar"||view==="schedule")&&(
        <div style={{background:B.white,borderBottom:`1.5px solid ${B.lightGrey}`,flexShrink:0}}>
          <div className="hide-scroll" style={{padding:"10px 24px",display:"flex",alignItems:"center",gap:10, borderBottom:`1px dashed ${B.lightGrey}`}}>
            <span style={{fontSize:12,fontWeight:800,color:B.midGrey,letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>👥 Team:</span>
            {teamNames.map(t=>(<button key={t} className="pill" style={{background:filterTeam===t?B.teal:B.offWhite,color:filterTeam===t?B.white:B.midGrey}} onClick={()=>setFilterTeam(t)}>{t}</button>))}
          </div>
          <div className="hide-scroll" style={{padding:"10px 24px",display:"flex",alignItems:"center",gap:10, borderBottom:`1px dashed ${B.lightGrey}`}}>
            <span style={{fontSize:12,fontWeight:800,color:B.midGrey,letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>🏷️ Typ:</span>
            <button className="pill" style={{background:filterEventType==="all"?B.anthracite:B.offWhite,color:filterEventType==="all"?B.white:B.midGrey}} onClick={()=>setFilterEventType("all")}>Alle</button>
            {EVENT_TYPES.map(t=>(<button key={t.value} className="pill" style={{background:filterEventType===t.value?t.color:B.offWhite,color:filterEventType===t.value?B.white:B.midGrey}} onClick={()=>setFilterEventType(t.value)}>{t.label}</button>))}
          </div>
          <div className="hide-scroll" style={{padding:"8px 24px",display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:11,fontWeight:800,color:B.midGrey,letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>🎨 Legende:</span>
            {EVENT_TYPES.map(t=>(<div key={t.value} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:B.charcoal,flexShrink:0}}><div style={{width:12,height:12,borderRadius:3,background:t.color}}/>{t.label}</div>))}
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:B.charcoal,flexShrink:0}}><div style={{width:12,height:12,borderRadius:3,background:BUS.color}}/>🚌 Bus</div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <main className="main-wrapper">
        {/* ════ HOME ════ */}
        {view==="home"&&(
          <div style={{maxWidth:960,margin:"0 auto"}}>
            <div style={{background:`linear-gradient(135deg,${B.teal},${B.tealDark})`,borderRadius:16,padding:"32px 36px",marginBottom:28,color:B.white,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-10,top:-30,opacity:.07,fontSize:200,lineHeight:1,pointerEvents:"none"}}>⚽</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}><VereinsLogo size={56}/><div><div style={{fontSize:11,fontWeight:700,letterSpacing:3,opacity:.8,textTransform:"uppercase"}}>Willkommen bei</div><div style={{fontSize:30,fontWeight:900,letterSpacing:2,textTransform:"uppercase",lineHeight:1.1}}>TV Hindelang Fussball</div></div></div>
              <p style={{fontFamily:"'Barlow',sans-serif",fontSize:15,lineHeight:1.65,opacity:.92,maxWidth:580}}>{safeStr(introText)}</p>
            </div>
            <div className="grid-2">
             <div className="tile" style={{cursor: "default"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center", cursor: "pointer"}} onClick={()=>setView("calendar")}>
                  <span style={{fontSize:13,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:B.teal}}>📅 Nächste Termine</span>
                  <span style={{fontSize:11,color:B.midGrey,fontWeight:600}}>Kalender →</span>
                </div>
                {nextThree.length===0 ? <div style={{fontSize:13,color:B.midGrey,fontFamily:"'Barlow',sans-serif"}}>Keine kommenden Termine</div> : nextThree.map(ev=>{
                  if (!ev) return null; const t=typeOf(ev.type); const sd=safeDateObj(ev.date); const hasBus=ev.bus1||ev.bus2;
                  return (
                    <div 
                      key={ev.id || Math.random()} 
                      style={{display:"flex",gap:12,alignItems:"center",padding:"9px 11px",background:B.offWhite,borderRadius:8,borderLeft:`3px solid ${hasBus?BUS.color:t.color}`, cursor: "pointer"}}
                      onClick={() => {
                        const d = new Date(ev.date);
                        if (!isNaN(d.getTime())) {
                          setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1)); // Setzt den richtigen Monat
                          setSelectedDay(d.getDate()); // Wählt den richtigen Tag aus
                          setView("calendar"); // Wechselt zum Kalender
                        }
                      }}
                    >
                      <div style={{textAlign:"center",minWidth:30,flexShrink:0}}><div style={{fontSize:19,fontWeight:900,color:hasBus?BUS.color:t.color,lineHeight:1}}>{sd.day}</div><div style={{fontSize:10,color:B.midGrey,fontWeight:700}}>{sd.month}</div></div>
                      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{safeStr(ev.title)}</div><div style={{fontSize:11,color:B.midGrey}}>⏰ {safeStr(ev.time)} {ev.endTime ? `- ${safeStr(ev.endTime)}` : ""} · {safeStr(ev.team)}</div></div>
                    </div>
                  );
                })}
              </div>
              <div className="tile" onClick={()=>setView("schedule")}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:B.red}}>📋 Spielplan</span><span style={{fontSize:11,color:B.midGrey,fontWeight:600}}>Alle Spiele →</span></div>
                {events.filter(e=>e && e.type==="game"&&(e.date||"")>=todayStr).sort((a,b)=>safeStr(a.date).localeCompare(safeStr(b.date))).slice(0,3).map(ev=>{
                  if (!ev) return null; const sd=safeDateObj(ev.date);
                  return (
                    <div key={ev.id || Math.random()} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 11px",background:B.redLight,borderRadius:8}}>
                      <div style={{textAlign:"center",minWidth:28,flexShrink:0}}><div style={{fontSize:17,fontWeight:900,color:B.red,lineHeight:1}}>{sd.day}</div><div style={{fontSize:10,color:B.red,fontWeight:700,opacity:.7}}>{sd.month}</div></div>
                      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{safeStr(ev.title)}</div><div style={{fontSize:11,color:B.midGrey}}>{safeStr(ev.team)} · {safeStr(ev.time)} {ev.endTime ? `- ${safeStr(ev.endTime)}` : ""} Uhr</div></div>
                    </div>
                  );
                })}
              </div>
              <div className="tile" onClick={()=>setView("teams")}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:B.green}}>👥 Mannschaften</span><span style={{fontSize:11,color:B.midGrey,fontWeight:600}}>Übersicht →</span></div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{teams.map(t=>{ if (!t) return null; return <span key={t.id || Math.random()} style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:B.tealLight,color:B.teal}}>{safeStr(t.name)}</span>})}</div>
                <div style={{fontSize:13,color:B.midGrey,fontFamily:"'Barlow',sans-serif"}}>{teams.length} aktive Mannschaften</div>
              </div>
              <div className="tile" style={{cursor:"default"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:B.amber}}>📢 News</span>{canEditNews&&<button className="btn btn-primary" style={{padding:"5px 12px",fontSize:11}} onClick={e=>{e.stopPropagation();openAddNews();}}>+ News</button>}</div>
                {news.slice(0,2).map(n=>{
                  if (!n) return null;
                  return (
                  <div key={n.id || Math.random()} style={{padding:"10px 12px",background:B.amberLight,borderRadius:8,borderLeft:`3px solid ${B.amber}`}}>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:3}}>{safeStr(n.title)}</div>
                    <div style={{fontSize:12,color:B.charcoal,fontFamily:"'Barlow',sans-serif",lineHeight:1.5}}>{safeStr(n.body).slice(0,90)}{safeStr(n.body).length>90?"…":""}</div>
                    {n.fileUrl && n.fileUrl.startsWith("data:image") ? ( <div onClick={() => setFullscreenImage(n.fileUrl)} style={{display:"block", marginTop:8, cursor: "zoom-in"}}><img src={n.fileUrl} alt="News Anhang" style={{width:"100%", maxHeight:160, objectFit:"cover", borderRadius:6, border:`1px solid ${B.lightGrey}`}} /></div> ) : null}
                    <div style={{fontSize:10,color:B.midGrey,marginTop:6,fontWeight:600}}>{safeStr(n.date)} · {safeStr(n.author)}</div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}

        {/* ════ CALENDAR ════ */}
        {view==="calendar"&&(
          <div className="cal-layout">
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <h1 style={{fontSize:30,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>{MONTHS[month]} <span style={{color:B.teal}}>{year}</span></h1>
                <div style={{display:"flex",gap:8}}><button className="btn btn-ghost" onClick={()=>setCurrentDate(new Date(year,month-1,1))}>◀</button><button className="btn btn-ghost" onClick={()=>setCurrentDate(new Date(year,month+1,1))}>▶</button>{canEditEvents&&<button className="btn btn-primary" onClick={()=>openAddEvent()}>+ Termin</button>}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:5}}>{DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,letterSpacing:2,color:B.midGrey}}>{d}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
                {Array.from({length:startOffset}).map((_,i)=><div key={`e${i}`} className="cal-day other-month"/>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1; const dayEvs=getDay(day); const now=new Date(); const isToday=day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear(); const isSel=selectedDay===day;
                  return (
                    <div key={day} className={`cal-day ${isToday?"today":""} ${isSel?"selected":""}`} onClick={()=>setSelectedDay(day===selectedDay?null:day)}>
                      <div style={{fontSize:12,fontWeight:700,color:isToday||isSel?B.teal:B.charcoal,marginBottom:2}}>{day}</div>
                      {dayEvs.slice(0,3).map(ev=><div key={ev.id || Math.random()} className="event-bar" style={{background:(ev.bus1||ev.bus2)?BUS.color:typeOf(ev.type).color}} title={safeStr(ev.title)}/>)}
                      {dayEvs.length>3&&<div style={{fontSize:9,color:B.midGrey,fontWeight:700}}>+{dayEvs.length-3}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card cal-sidebar" style={{padding:20,alignSelf:"start"}}>
              {selectedDay ? (
                <>
                  <div style={{marginBottom:16}}><div style={{fontSize:20,fontWeight:900}}>{selectedDay}. {MONTHS[month]} {year}</div><div style={{fontSize:12,color:B.midGrey,marginTop:2}}>{selectedEvs.length} Termin{selectedEvs.length!==1?"e":""}</div></div>
                  {selectedEvs.length===0 ? <div style={{textAlign:"center",color:B.midGrey,padding:"24px 0",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Keine Termine an diesem Tag</div> : selectedEvs.map(ev=><EventCard key={ev.id || Math.random()} ev={ev}/>)}
                  {canEditEvents&&<button className="btn btn-primary" style={{width:"100%",marginTop:8}} onClick={()=>openAddEvent(selectedStr)}>+ Termin hinzufügen</button>}
                </>
              ) : (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:220,color:B.midGrey,gap:10}}><div style={{fontSize:40}}>📅</div><div style={{fontSize:14,fontFamily:"'Barlow',sans-serif",textAlign:"center"}}>Tag auswählen<br/>für Details</div></div>
              )}
            </div>
          </div>
        )}

        {/* ════ SCHEDULE ════ */}
        {view==="schedule"&&(
          <div style={{maxWidth:920,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h1 style={{fontSize:30,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>Spielplan & <span style={{color:B.teal}}>Termine</span></h1>{canEditEvents&&<button className="btn btn-primary" onClick={()=>openAddEvent()}>+ Neuer Termin</button>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {upcoming.length===0 ? <div style={{textAlign:"center",color:B.midGrey,padding:48}}>Keine Termine für diese Auswahl</div> : upcoming.map(ev=>{
                if (!ev) return null; const t=typeOf(ev.type); const sd=safeDateObj(ev.date); const hasBus=ev.bus1||ev.bus2; const myProfile = allUsers.find(u => u.id === user?.uid); const myName = myProfile?.name || user?.email; const hasDeclined = Array.isArray(ev.declines) && ev.declines.includes(myName);
                return (
                  <div key={ev.id || Math.random()} className="card schedule-grid" onMouseEnter={e=>e.currentTarget.style.borderColor=hasBus?BUS.color:t.color} onMouseLeave={e=>e.currentTarget.style.borderColor=B.lightGrey}>
                    <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:hasBus?BUS.color:t.color,lineHeight:1}}>{sd.day}</div><div style={{fontSize:11,color:B.midGrey,fontWeight:700}}>{sd.month}</div></div>
                    <div style={{width:3,background:hasBus?BUS.color:t.color,borderRadius:2,alignSelf:"stretch"}}/>
                    <div style={{flex: 1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:800,fontSize:16}}>{safeStr(ev.title)}</span><Chip bg={t.bg} c={t.color}>{t.label}</Chip>{ev.team&&<Chip bg={B.anthracite+"11"} c={B.charcoal}>{safeStr(ev.team)}</Chip>}{ev.bus1&&<Chip bg={BUS.bg} c={BUS.color} border={`1px solid ${BUS.border}`}>🚌 Bus 1</Chip>}{ev.bus2&&<Chip bg={BUS.bg} c={BUS.color} border={`1px solid ${BUS.border}`}>🚌 Bus 2</Chip>}</div>
                      <div style={{color:B.midGrey,fontSize:12}}>⏰ {safeStr(ev.time)} {ev.endTime ? `- ${safeStr(ev.endTime)}` : ""} Uhr · 📍 {safeStr(ev.location)}</div>
                      {ev.notes&&<div style={{fontSize:12,color:B.charcoal,marginTop:2,fontStyle:"italic",fontFamily:"'Barlow',sans-serif"}}>{safeStr(ev.notes)}</div>}
                      {canEditEvents && Array.isArray(ev.declines) && ev.declines.length > 0 && (<div style={{marginTop: 6, fontSize: 12, color: B.red, fontFamily:"'Barlow',sans-serif"}}><strong>❌ {ev.declines.length} Absage(n):</strong> {ev.declines.filter(n=>typeof n==='string').join(", ")}</div>)}
                    </div>
                    <div className="schedule-actions">
                      <button className="btn btn-ghost" style={{padding:"5px 10px", fontSize:11, color: hasDeclined ? B.charcoal : B.red, background: hasDeclined ? B.lightGrey : B.redLight}} onClick={()=>toggleDecline(ev)}>{hasDeclined ? "✅ Doch dabei" : "❌ Ich fehle"}</button>
                      {canEditEvents&&<div style={{display:"flex",gap:6}}><button className="btn btn-edit" style={{background:"#25D366", color:"white"}} onClick={()=>shareEventWhatsApp(ev)}>📲 WA</button><button className="btn btn-edit" onClick={()=>openEditEvent(ev)}>✏️</button><button className="btn btn-danger" onClick={()=>deleteEvent(ev.id)}>🗑️</button></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ TEAMS ════ */}
        {view==="teams"&&!selectedTeam&&(
          <div style={{maxWidth:1040,margin:"0 auto"}}>
            <h1 style={{fontSize:30,fontWeight:900,letterSpacing:2,textTransform:"uppercase",marginBottom:22}}>Mannschaften <span style={{color:B.teal}}>({teams.length})</span></h1>
            <div className="grid-2" style={{gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))"}}>
              {teams.map(ti=>{
                if (!ti) return null;
                return (
                <div key={ti.id || Math.random()} className="team-card" onClick={()=>setSelectedTeam(ti)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div style={{fontSize:22,fontWeight:900,letterSpacing:1}}>{safeStr(ti.name)}</div><span style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:B.tealLight,color:B.teal}}>{safeStr(ti.jahrgang)}</span></div>
                  <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif",marginBottom:4}}>👤 <strong>Trainer:</strong> {getTrainerNames(ti)}</div>
                  <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif"}}>⏰ {safeStr(ti.training)}</div>
                  <div style={{marginTop:12,fontSize:11,color:B.teal,fontWeight:700}}>Details →</div>
                </div>
              )})}
            </div>
          </div>
        )}
        {view==="teams"&&selectedTeam&&(
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <button className="btn btn-ghost" style={{marginBottom:20}} onClick={()=>setSelectedTeam(null)}>← Zurück</button>
            <div className="card" style={{padding:"28px 32px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div><div style={{fontSize:32,fontWeight:900,letterSpacing:2,textTransform:"uppercase"}}>{safeStr(selectedTeam.name)}</div><span style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:B.tealLight,color:B.teal,marginTop:6}}>{safeStr(selectedTeam.jahrgang)}</span></div>
                {isAdmin&&<button className="btn btn-edit" onClick={()=>openEditTeam(selectedTeam)}>✏️ Bearbeiten</button>}
              </div>
              <div style={{display:"flex",gap:16,alignItems:"flex-start",padding:"14px 0",borderBottom:`1px solid ${B.lightGrey}`}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:B.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:B.midGrey,textTransform:"uppercase",marginBottom:4}}>Trainer</div>
                  {selectedTeam.trainers && Array.isArray(selectedTeam.trainers) && selectedTeam.trainers.length > 0 ? (
                    selectedTeam.trainers.map((tr, idx) => (
                      <div key={idx} style={{marginBottom: idx === selectedTeam.trainers.length - 1 ? 0 : 10}}><div style={{fontSize:15,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>{safeStr(tr?.name) || "N.N."}</div>{tr?.phone && (<div style={{fontSize:13,fontFamily:"'Barlow',sans-serif",marginTop:2}}>📞 <a href={`tel:${tr.phone}`} style={{color:B.teal,textDecoration:"none",fontWeight:500}}>{safeStr(tr.phone)}</a></div>)}</div>
                    ))
                  ) : (<div style={{fontSize:15,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>{safeStr(selectedTeam.trainer) || 'N.N.'}</div>)}
                </div>
              </div>
              {[{icon:"⏰",label:"Trainingszeiten",val:safeStr(selectedTeam.training)},{icon:"🎂",label:"Jahrgang",val:safeStr(selectedTeam.jahrgang)}].map(row=>(
                <div key={row.label} style={{display:"flex",gap:16,alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${B.lightGrey}`}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:B.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{row.icon}</div>
                  <div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:B.midGrey,textTransform:"uppercase"}}>{row.label}</div><div style={{fontSize:15,fontWeight:700,marginTop:1,fontFamily:"'Barlow',sans-serif"}}>{row.val}</div></div>
                </div>
              ))}
             <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:1,color:B.midGrey,textTransform:"uppercase",marginBottom:10}}>Nächste Termine</div>
                {events.filter(e=>e && e.team===selectedTeam.name&&(e.date||"")>=todayStr).sort((a,b)=>safeStr(a.date).localeCompare(safeStr(b.date))).slice(0,4).map(ev=>(
                  <EventCard 
                    key={ev.id || Math.random()} 
                    ev={ev} 
                    controls={false} 
                    showDate={true}
                    onClick={() => {
                      const d = new Date(ev.date);
                      if (!isNaN(d.getTime())) {
                        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1)); // Stellt den Kalendermonat ein
                        setSelectedDay(d.getDate()); // Wählt exakt diesen Tag aus
                        setView("calendar"); // Wechselt zum Kalender-Reiter
                        setSelectedTeam(null); // Schließt die Team-Detailansicht
                      }
                    }}
                  />
                ))}
                {events.filter(e=>e && e.team===selectedTeam.name&&(e.date||"")>=todayStr).length===0&&<div style={{fontSize:13,color:B.midGrey,fontFamily:"'Barlow',sans-serif"}}>Keine kommenden Termine</div>}
              </div>
            </div>
          </div>
        )}

        {/* ════ MESSAGES ════ */}
        {view==="messages"&&(
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div className="chat-layout">
              <div className={`chat-sidebar ${activeThread ? 'mobile-hidden' : ''}`} style={{borderRight:`1.5px solid ${B.lightGrey}`,background:B.offWhite, display: "flex", flexDirection: "column"}}>
                <div style={{padding:"16px 14px",borderBottom:`1.5px solid ${B.lightGrey}`,background:B.white,flexShrink:0}}><div style={{fontSize:15,fontWeight:900,letterSpacing:1,textTransform:"uppercase"}}>Nachrichten</div></div>
                <div style={{flex:1,overflow:"auto"}}>
                  {visibleThreads.length === 0 && (<div style={{padding: 20, textAlign: "center", color: B.midGrey, fontSize: 13}}>Keine aktiven Chats.</div>)}
                  {visibleThreads.map(th=>{
                    if (!th) return null;
                    const last = Array.isArray(th.messages) && th.messages.length > 0 ? th.messages[th.messages.length - 1] : null; const isActive=activeThread?.id===th.id; const isUnread = checkUnread(th);
                    let displayLabel = safeStr(th.label);
                    if (th.type === "direct") { const otherId = Array.isArray(th.participants) ? (th.participants.find(id => id !== user.uid) || user.uid) : user.uid; const otherUser = allUsers.find(u => u.id === otherId); displayLabel = otherUser ? safeStr(otherUser.name || otherUser.email) : "Benutzer"; }
                    return (
                      <div key={th.id || Math.random()} style={{padding:"11px 14px",display:"flex",gap:10,alignItems:"center",cursor:"pointer",background:isActive?B.tealLight:"transparent",borderBottom:`1px solid ${B.lightGrey}`,transition:"background .15s"}} onClick={()=>openChat(th)}>
                        <div style={{width:38,height:38,borderRadius:th.type==="group"?"10px":"50%",background:`linear-gradient(135deg,${B.teal},${B.tealDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"white",fontWeight:800,flexShrink:0}}>{th.type==="group"?"👥":safeStr(displayLabel).slice(0,2).toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:isUnread?900:700,fontSize:14,color:isActive?B.teal:B.anthracite,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{displayLabel}</div><div style={{fontSize:11,color:isUnread?B.anthracite:B.midGrey,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:isUnread?700:400}}>{last ? `${safeStr(last.from)}: ${safeStr(last.text)}` : "Noch keine Nachrichten"}</div></div>
                        {isUnread && <div className="unread-dot" />}
                      </div>
                    );
                  })}
                </div>
                <div style={{padding:"12px 14px",borderTop:`1.5px solid ${B.lightGrey}`,background:B.white,flexShrink:0}}><button className="btn btn-primary" style={{width:"100%",fontSize:12,padding:9}} onClick={()=>setShowNewThread(true)}>+ Neuer Chat</button></div>
              </div>
              <div className={`chat-main ${!activeThread ? 'mobile-hidden' : ''}`} style={{background:B.white, display:"flex", flexDirection:"column"}}>
                {activeThread ? (
                  <>
                    <div style={{padding:"14px 20px",borderBottom:`1.5px solid ${B.lightGrey}`,display:"flex",alignItems:"center",gap:12,background:B.white,flexShrink:0}}>
                      <button className="mobile-back-btn" onClick={() => setActiveThread(null)}>←</button>
                      <div style={{width:38,height:38,borderRadius:activeThread.type==="group"?"10px":"50%",background:`linear-gradient(135deg,${B.teal},${B.tealDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"white",fontWeight:800}}>{activeThread.type==="group"?"👥":safeStr(activeThread.label).slice(0,2).toUpperCase()}</div>
                      <div><div style={{fontWeight:800,fontSize:15}}>{activeThread.type === "direct" ? safeStr(allUsers.find(u => u.id === (Array.isArray(activeThread.participants) ? activeThread.participants.find(id => id !== user.uid) : user.uid))?.name || "Benutzer") : safeStr(activeThread.label)}</div><div style={{fontSize:11,color:B.midGrey}}>{activeThread.type==="group"?`Gruppen-Chat · ${safeStr(activeThread.team)}`:"Direktnachricht"}</div></div>
                    </div>
                    <div style={{flex:1,overflow:"auto",padding:20,display:"flex",flexDirection:"column",gap:10,background:B.offWhite}}>
                      {(!Array.isArray(activeThread.messages)||activeThread.messages.length===0)&&<div style={{textAlign:"center",color:B.midGrey,padding:"40px 0",fontSize:14}}>Noch keine Nachrichten</div>}
                      {Array.isArray(activeThread.messages) && activeThread.messages.map((msg,i)=>{
                        if (!msg) return null; const myProfile = allUsers.find(u => u.id === user.uid); const isMe = msg.from === (myProfile?.name || user.email);
                        return (
                          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                            {!isMe&&<div style={{fontSize:11,color:B.midGrey,marginBottom:2,fontWeight:600}}>{safeStr(msg.from)}</div>}
                            <div className={isMe?"chat-me":"chat-them"}>{safeStr(msg.text)}</div><div style={{fontSize:10,color:B.midGrey,marginTop:3}}>{safeStr(msg.time)}</div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef}/>
                    </div>
                    <div style={{padding:"12px 16px",borderTop:`1.5px solid ${B.lightGrey}`,display:"flex",gap:10,background:B.white,flexShrink:0}}><input className="input" placeholder="Nachricht schreiben..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} style={{flex:1}}/><button className="btn btn-primary" style={{flexShrink:0,padding:"9px 20px"}} onClick={sendMessage}>➤</button></div>
                  </>
                ) : (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:B.midGrey,background:B.offWhite,height:"100%"}}><div style={{fontSize:48}}>💬</div><div style={{fontSize:16,fontWeight:700}}>Chat auswählen</div></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ ADMIN / TRAINER ════ */}
        {view==="admin"&&canAccessAdmin&&(
          <div style={{maxWidth:1040,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
              <div style={{width:40,height:40,borderRadius:10,background:isAdmin?B.amberLight:B.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>⚙️</div>
              <div><h1 style={{fontSize:28,fontWeight:900,letterSpacing:2,textTransform:"uppercase",color:isAdmin?B.amber:B.teal}}>{isAdmin ? "Admin-Bereich" : "Trainer-Bereich"}</h1><div style={{fontSize:12,color:B.midGrey}}>Eingeloggt als: {safeStr(user?.email)}</div></div>
            </div>
            <div className="admin-tabs-container">
              <div style={{display:"flex",borderBottom:`1.5px solid ${B.lightGrey}`,marginBottom:24,marginTop:16,background:B.white,borderRadius:"8px 8px 0 0", width: "max-content", minWidth: "100%"}}>
                {getAdminTabs().map(tab=>(<button key={tab.id} className={`admin-tab ${adminSection===tab.id?"active":""}`} onClick={()=>setAdminSection(tab.id)}>{tab.label}</button>))}
              </div>
            </div>

            {adminSection==="teams"&&isAdmin&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:16,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Mannschaften ({(teams||[]).length})</div><button className="btn btn-primary" onClick={openAddTeam}>+ Team</button></div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(!teams || teams.length === 0) && <div style={{color:B.midGrey, fontSize:14}}>Keine Mannschaften gefunden.</div>}
                  {(teams||[]).map(t=>{
                    if (!t || typeof t !== 'object') return null;
                    return (
                    <div key={t.id || Math.random()} className="card admin-list-item">
                      <div style={{fontWeight:800,fontSize:16}}>{safeStr(t.name) || "Unbenannt"}</div>
                      <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif"}}>👤 {getTrainerNames(t)}</div>
                      <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif"}}>⏰ {safeStr(t.training) || "Keine Zeit"}</div>
                      <div style={{fontSize:13,color:B.midGrey,fontFamily:"'Barlow',sans-serif"}}>🎂 {safeStr(t.jahrgang) || "Kein Jahrgang"}</div>
                      <div className="admin-list-actions"><button className="btn btn-edit" onClick={()=>openEditTeam(t)}>✏️</button><button className="btn btn-danger" onClick={()=>deleteTeam(t.id)}>🗑️</button></div>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {adminSection==="events"&&canEditEvents&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16, flexWrap: "wrap", gap: 10}}>
                  <div style={{fontSize:16,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Termine ({(events||[]).length})</div>
                  <div style={{display:"flex", gap: 10}}><input type="file" accept=".csv" style={{display: "none"}} ref={csvInputRef} onChange={handleCSVUpload} /><button className="btn btn-ghost" onClick={() => csvInputRef.current?.click()} disabled={isImporting}>{isImporting ? "⏳ Lädt..." : "📥 CSV"}</button><button className="btn btn-primary" onClick={()=>openAddEvent()}>+ Termin</button></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[...(events||[])].sort((a,b)=>safeStr(a?.date).localeCompare(safeStr(b?.date))).map(ev=>{
                    if (!ev || typeof ev !== 'object') return null; const t=typeOf(ev.type); const sd = safeDateObj(ev.date);
                    return (
                      <div key={ev.id || Math.random()} className="card schedule-grid">
                        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:t.color,lineHeight:1}}>{sd.day}</div><div style={{fontSize:10,color:B.midGrey,fontWeight:700}}>{sd.month} {sd.year}</div></div>
                        <div style={{width:3,background:t.color,borderRadius:2,alignSelf:"stretch"}}/>
                        <div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:3}}><span style={{fontWeight:800,fontSize:14}}>{safeStr(ev.title) || "Ohne Titel"}</span><Chip bg={t.bg} c={t.color}>{safeStr(t.label)}</Chip><Chip bg={B.anthracite+"11"} c={B.charcoal}>{safeStr(ev.team) || "Kein Team"}</Chip></div>
                          <div style={{fontSize:12,color:B.midGrey}}>⏰ {safeStr(ev.time)} {ev.endTime ? `- ${safeStr(ev.endTime)}` : ""} · 📍 {safeStr(ev.location) || "Ohne Ort"}</div>
                        </div>
                        <div className="schedule-actions"><button className="btn btn-edit" style={{background:"#25D366", color:"white"}} onClick={()=>shareEventWhatsApp(ev)}>📲 WA</button><button className="btn btn-edit" onClick={()=>openEditEvent(ev)}>✏️</button><button className="btn btn-danger" onClick={()=>deleteEvent(ev.id)}>🗑️</button></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {adminSection==="news"&&canEditNews&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:16,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>News ({(news||[]).length})</div><button className="btn btn-primary" onClick={openAddNews}>+ News</button></div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {(news||[]).map(n=>{
                    if (!n || typeof n !== 'object') return null;
                    return (
                    <div key={n.id || Math.random()} className="card" style={{padding:"16px 20px",borderLeft:`3px solid ${B.amber}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}} className="event-card-inner">
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{safeStr(n.title) || "Ohne Titel"}</div>
                          <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif",lineHeight:1.5,marginBottom:6}}>{safeStr(n.body).slice(0,90)}{safeStr(n.body).length>90?"…":""}</div>
                          {n.fileUrl && n.fileUrl.startsWith("data:image") ? ( <div onClick={() => setFullscreenImage(n.fileUrl)} style={{display:"block", marginTop:8, marginBottom:6, cursor: "zoom-in"}}><img src={n.fileUrl} alt="Anhang" style={{maxWidth:"100%", maxHeight:120, objectFit:"cover", borderRadius:6, border:`1px solid ${B.lightGrey}`}} /></div>) : null}
                          <div style={{fontSize:11,color:B.midGrey,fontWeight:600}}>{safeStr(n.date)} · {safeStr(n.author)}</div>
                        </div>
                        <div className="event-card-actions"><button className="btn btn-edit" style={{background:"#25D366", color:"white"}} onClick={()=>shareNewsWhatsApp(n)}>📲 WA</button><button className="btn btn-edit" onClick={()=>openEditEvent(n)}>✏️</button><button className="btn btn-danger" onClick={()=>deleteNews(n.id)}>🗑️</button></div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {adminSection==="users"&&isAdmin&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:16,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Benutzer ({(allUsers||[]).length})</div><button className="btn btn-primary" onClick={openAddUser}>+ Nutzer</button></div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(allUsers||[]).map(u=>{
                    if (!u || typeof u !== 'object') return null;
                    const getRoleLabel = (r) => { if(r==="admin") return "Admin"; if(r==="trainer") return "Trainer"; if(r==="parent") return "Eltern"; return "Aktiv"; };
                    const getRoleColor = (r) => { if(r==="admin") return { bg: B.amberLight, c: B.amber }; if(r==="trainer") return { bg: B.tealLight, c: B.teal }; if(r==="parent") return { bg: B.offWhite, c: B.midGrey }; return { bg: B.greenLight, c: B.green }; };
                    const rc = getRoleColor(u.role);
                    return (
                      <div key={u.id || Math.random()} className="card admin-list-item" style={{gridTemplateColumns:"1fr 1fr auto auto"}}>
                        <div style={{fontWeight:800,fontSize:16}}>{u.name ? safeStr(u.name) : <span style={{color:B.midGrey,fontStyle:"italic"}}>Kein Name</span>}{Array.isArray(u.assignedTeams) && u.assignedTeams.length > 0 && <div style={{fontSize:11, color:B.midGrey, marginTop:2}}>Zugeordnet: {u.assignedTeams.map(x=>safeStr(x)).join(", ")}</div>}</div>
                        <div style={{fontSize:13,color:B.charcoal,fontFamily:"'Barlow',sans-serif", overflow:"hidden", textOverflow:"ellipsis"}}>✉️ {safeStr(u.email || u.id)}</div>
                        <div><Chip bg={rc.bg} c={rc.c}>{safeStr(getRoleLabel(u.role))}</Chip></div>
                        <div className="admin-list-actions"><button className="btn btn-edit" onClick={()=>openEditUser(u)}>✏️ Bearbeiten</button><button className="btn btn-danger" onClick={()=>deleteUser(u.id)}>🗑️</button></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {adminSection==="intro"&&isAdmin&&(
              <div style={{maxWidth:640}}>
                <div style={{fontSize:16,fontWeight:800,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Vorstellungstext Startseite</div>
                <div className="card" style={{padding:24}}>
                  <label style={LBL}>Text bearbeiten</label>
                  <textarea className="input" value={safeStr(introText)} onChange={e=>setIntroText(e.target.value)} style={{minHeight:140,marginBottom:16}}/>
                  <div style={{padding:"12px 16px",background:B.tealLight,borderRadius:8,borderLeft:`3px solid ${B.teal}`,marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:B.teal,letterSpacing:1,marginBottom:4}}>VORSCHAU</div>
                    <p style={{fontFamily:"'Barlow',sans-serif",fontSize:14,lineHeight:1.6,color:B.charcoal}}>{safeStr(introText)}</p>
                  </div>
                  <button className="btn btn-primary" style={{width:"100%"}} onClick={()=>saveIntro(introText)}>💾 Speichern</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", padding: "60px 24px 20px", marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 12, fontWeight: 700, color: B.midGrey, textTransform: "uppercase", letterSpacing: 1 }}>
            <a href="https://www.tvhindelang.de/impressum" target="_blank" rel="noopener noreferrer" style={{ color: B.midGrey, textDecoration: "none" }}>Impressum (Web)</a>
            <span style={{ color: B.midGrey, cursor: "pointer" }} onClick={() => setShowPrivacyModal(true)}>App-Datenschutz</span>
          </div>
          <div style={{ fontSize: 11, color: B.midGrey, marginTop: 12, fontFamily: "'Barlow', sans-serif" }}>
            © {new Date().getFullYear()} TV Hindelang e.V. Fussball
          </div>
        </div>

        {/* ════ BILD FULLSCREEN MODAL ════ */}
        {fullscreenImage && (
          <div className="modal-bg" style={{zIndex: 9999, padding: 20, background: "rgba(0,0,0,0.85)", flexDirection: "column"}} onClick={() => setFullscreenImage(null)}>
            <div style={{width: "100%", maxWidth: 800, display: "flex", justifyContent: "flex-end", marginBottom: 10}}>
              <button style={{background: B.white, color: B.anthracite, border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, fontWeight: "bold", cursor: "pointer"}} onClick={() => setFullscreenImage(null)}>✕</button>
            </div>
            <img src={fullscreenImage} style={{maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.5)"}} alt="Vollbild" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="bottom-nav">
        {NAV.map(({id,icon,label,badge})=>(
          <button key={id} className={`bottom-nav-item ${view===id?"active":""}`} onClick={()=>{setView(id);setSelectedTeam(null); setActiveThread(null);}}><div className="bottom-nav-icon" style={{position:"relative"}}>{icon}{badge && <div className="nav-badge-mobile" />}</div>{label}</button>
        ))}
        {canAccessAdmin&&(<button className={`bottom-nav-item ${view==="admin"?"active":""}`} onClick={()=>{setView("admin");if(isTrainer && !isAdmin && adminSection !== "events" && adminSection !== "news") setAdminSection("events");}}><div className="bottom-nav-icon">⚙️</div>Admin</button>)}
      </nav>

      {/* ════ EVENT MODAL ════ */}
      {showEventModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowEventModal(false)}>
          <div className="modal">
            <div style={{height:4,background:`linear-gradient(90deg,${B.teal},${B.tealDark})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:20}}>{editingEvent?"Termin bearbeiten":"Neuer Termin"}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={LBL}>Typ</label><select className="input" value={eventForm.type} onChange={e=>setEventForm({...eventForm,type:e.target.value})}>{EVENT_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label style={LBL}>Mannschaft</label><select className="input" value={eventForm.team} onChange={e=>setEventForm({...eventForm,team:e.target.value})}>{teamNames.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><label style={LBL}>Titel *</label><input className="input" placeholder="z.B. Heimspiel vs. SV Musterstadt" value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><label style={LBL}>Datum *</label><input className="input" type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm,date:e.target.value})}/></div>
                <div><label style={LBL}>Startzeit</label><input className="input" type="time" value={eventForm.time} onChange={e=>setEventForm({...eventForm,time:e.target.value})}/></div>
                <div><label style={LBL}>Endzeit</label><input className="input" type="time" value={eventForm.endTime} onChange={e=>setEventForm({...eventForm,endTime:e.target.value})}/></div>
              </div>
              {!editingEvent && (
                <div style={{marginTop: -4, background: eventForm.isRecurring ? B.tealLight : "transparent", padding: eventForm.isRecurring ? "10px 14px" : "0 4px", borderRadius: 8, transition: "all .2s"}}>
                  <label style={{display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:700, cursor:"pointer", color: eventForm.isRecurring ? B.tealDark : B.charcoal}}><input type="checkbox" style={{width: 16, height: 16}} checked={eventForm.isRecurring} onChange={e=>setEventForm({...eventForm, isRecurring: e.target.checked})} />🔄 Wöchentlich wiederholen</label>
                  {eventForm.isRecurring && (<div style={{marginTop: 10}}><label style={LBL}>Letzter Termin am *</label><input className="input" type="date" value={eventForm.recurringEndDate} onChange={e=>setEventForm({...eventForm, recurringEndDate: e.target.value})} /></div>)}
                </div>
              )}
              <div><label style={LBL}>Ort</label><input className="input" placeholder="z.B. Sportplatz Hauptfeld" value={eventForm.location} onChange={e=>setEventForm({...eventForm,location:e.target.value})}/></div>
              <div><label style={LBL}>Hinweise</label><textarea className="input" value={eventForm.notes} onChange={e=>setEventForm({...eventForm,notes:e.target.value})}/></div>
              <div><label style={LBL}>🚌 Vereinsbus</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["bus1","Bus 1"],["bus2","Bus 2"]].map(([key,label])=>(
                    <div key={key} onClick={()=>setEventForm({...eventForm,[key]:!eventForm[key]})} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:8,border:`2px solid ${eventForm[key]?BUS.color:B.lightGrey}`,background:eventForm[key]?BUS.bg:B.white,cursor:"pointer",transition:"all .15s"}}>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${eventForm[key]?BUS.color:B.lightGrey}`,background:eventForm[key]?BUS.color:B.white,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{eventForm[key]&&<span style={{color:"white",fontSize:12,fontWeight:800}}>✓</span>}</div>
                      <span style={{fontSize:13,fontWeight:800,color:eventForm[key]?BUS.color:B.charcoal}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>{setShowEventModal(false); setNewsSaving(false);}}>Abbrechen</button>
                <button className="btn btn-primary" style={{flex:2}} onClick={saveEvent} disabled={!eventForm.title || !eventForm.date || (eventForm.isRecurring && !eventForm.recurringEndDate)}>{editingEvent ? "✓ Speichern" : (eventForm.isRecurring ? "🔄 Serie erstellen" : "+ Erstellen")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ NEWS MODAL ════ */}
      {showNewsModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowNewsModal(false)}>
          <div className="modal">
            <div style={{height:4,background:`linear-gradient(90deg,${B.amber},${B.red})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:20}}>{editingNews?"News bearbeiten":"Neue Ankündigung"}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={LBL}>Titel *</label><input className="input" value={newsForm.title} onChange={e=>setNewsForm({...newsForm,title:e.target.value})}/></div>
              <div><label style={LBL}>Text *</label><textarea className="input" style={{minHeight:100}} value={newsForm.body} onChange={e=>setNewsForm({...newsForm,body:e.target.value})}/></div>
              
              <div><label style={LBL}>Bild-Anhang (nur JPG, PNG)</label>
                <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setNewsForm({...newsForm, fileObj: e.target.files[0]})} />
                {newsForm.fileName && !newsForm.fileObj && (<div style={{fontSize:12, color:B.charcoal, marginTop:6}}>Aktueller Anhang: <span style={{color:B.teal, fontWeight:700}}>Bild vorhanden</span></div>)}
                {newsForm.fileObj && (<div style={{fontSize:12, color:B.charcoal, marginTop:6}}>Ausgewählt: <span style={{fontWeight:700}}>{newsForm.fileObj.name}</span></div>)}
              </div>

              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>{setShowNewsModal(false); setNewsSaving(false);}}>Abbrechen</button>
                <button className="btn btn-primary" style={{flex:2}} onClick={saveNews} disabled={!newsForm.title||!newsForm.body||newsSaving}>{newsSaving ? "Wird verarbeitet..." : (editingNews ? "✓ Speichern" : "📢 Veröffentlichen")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ TEAM MODAL ════ */}
      {showTeamModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowTeamModal(false)}>
          <div className="modal">
            <div style={{height:4,background:`linear-gradient(90deg,${B.green},${B.teal})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:20}}>{editingTeam?"Mannschaft bearbeiten":"Neue Mannschaft"}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={LBL}>Name *</label><input className="input" placeholder="z.B. G-Jugend" value={teamForm.name} onChange={e=>setTeamForm({...teamForm,name:e.target.value})}/></div>
                <div><label style={LBL}>Jahrgang</label><input className="input" placeholder="z.B. 2021/2022" value={teamForm.jahrgang} onChange={e=>setTeamForm({...teamForm,jahrgang:e.target.value})}/></div>
              </div>
              <div>
                <label style={LBL}>Trainer & Betreuer</label>
                {teamForm.trainers.map((tr, idx) => (
                  <div key={idx} style={{display:"flex", gap:8, marginBottom:8}}>
                    <input className="input" placeholder="Name" value={tr.name} onChange={e => { const newTr = [...teamForm.trainers]; newTr[idx].name = e.target.value; setTeamForm({...teamForm, trainers: newTr}); }} />
                    <input className="input" placeholder="Telefon" value={tr.phone} onChange={e => { const newTr = [...teamForm.trainers]; newTr[idx].phone = e.target.value; setTeamForm({...teamForm, trainers: newTr}); }} />
                    {teamForm.trainers.length > 1 && (<button className="btn btn-danger" style={{padding:"0 12px", fontSize:14}} onClick={() => { const newTr = teamForm.trainers.filter((_, i) => i !== idx); setTeamForm({...teamForm, trainers: newTr}); }}>X</button>)}
                  </div>
                ))}
                <button className="btn btn-ghost" style={{fontSize:11, padding:"6px 12px", marginTop:2}} onClick={() => setTeamForm({...teamForm, trainers: [...teamForm.trainers, {name:"", phone:""}]})}>+ Weiterer Trainer</button>
              </div>
              <div><label style={LBL}>Trainingszeiten</label><input className="input" placeholder="z.B. Di & Do 17:00 Uhr" value={teamForm.training} onChange={e=>setTeamForm({...teamForm,training:e.target.value})}/></div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowTeamModal(false)}>Abbrechen</button>
                <button className="btn btn-primary" style={{flex:2}} onClick={saveTeam} disabled={!teamForm.name}>{editingTeam?"✓ Speichern":"+ Erstellen"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ USER MODAL ════ */}
      {showUserModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowUserModal(false)}>
          <div className="modal" style={{maxWidth:460}}>
            <div style={{height:4,background:`linear-gradient(90deg,${B.amber},${B.teal})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:20}}>{editingUser ? "Benutzer bearbeiten" : "Neuen Benutzer anlegen"}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              {!editingUser && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div><label style={LBL}>E-Mail *</label><input className="input" type="email" placeholder="spieler@email.de" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})}/></div>
                  <div><label style={LBL}>Passwort *</label><input className="input" type="password" placeholder="Mind. 6 Zeichen" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})}/></div>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={LBL}>Anzeigename</label><input className="input" placeholder="z.B. Max Mustermann" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})}/></div>
                <div><label style={LBL}>Rolle</label>
                  <select className="input" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
                    <option value="admin">Administrator</option><option value="trainer">Trainer</option><option value="player">Aktiv (Spieler:in)</option><option value="parent">Eltern</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop: 4}}>
                <label style={LBL}>Zugeordnete Mannschaften (Für Gruppen-Chats)</label>
                <div style={{display:"flex", flexWrap:"wrap", gap:8, marginTop: 6}}>
                  {uniqueTeams.filter(t => t !== "Alle Mannschaften").map(tName => (
                    <label key={tName} style={{display:"flex", alignItems:"center", gap:6, fontSize:13, background: userForm.assignedTeams.includes(tName) ? B.tealLight : B.offWhite, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${userForm.assignedTeams.includes(tName) ? B.teal : B.lightGrey}`, cursor:"pointer", transition:"all .2s"}}>
                      <input type="checkbox" style={{width: 16, height: 16}} checked={userForm.assignedTeams.includes(tName)} onChange={e => { if(e.target.checked) setUserForm({...userForm, assignedTeams: [...userForm.assignedTeams, tName]}); else setUserForm({...userForm, assignedTeams: userForm.assignedTeams.filter(name => name !== tName)}); }} />
                      {tName}
                    </label>
                  ))}
                  {uniqueTeams.length === 0 && <div style={{fontSize:12, color:B.midGrey}}>Lege zuerst Teams an oder importiere Spiele.</div>}
                </div>
              </div>
              {userError && <div style={{color:B.red,fontSize:13,fontFamily:"'Barlow',sans-serif",marginTop:4}}>❌ {userError}</div>}
              <div style={{display:"flex",gap:10,marginTop:12}}>
                <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowUserModal(false)} disabled={userSaving}>Abbrechen</button>
                <button className="btn btn-primary" style={{flex:2}} onClick={saveUser} disabled={userSaving || (!editingUser && (!userForm.email || !userForm.password))}>{userSaving ? "Speichert..." : "✓ Speichern"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ NEW THREAD MODAL ════ */}
      {showNewThread&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowNewThread(false)}>
          <div className="modal" style={{maxWidth:420}}>
            <div style={{height:4,background:`linear-gradient(90deg,${B.teal},${B.tealDark})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:18}}>Neuer Chat</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[["group","👥 Gruppen-Chat"],["direct","👤 Direktnachricht"]].map(([type,label])=>(
                <button key={type} onClick={()=>setNewThreadType(type)} style={{border:`2px solid ${newThreadType===type?B.teal:B.lightGrey}`,background:newThreadType===type?B.tealLight:B.white,color:newThreadType===type?B.teal:B.midGrey,borderRadius:8,padding:10,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,transition:"all .15s"}}>{label}</button>
              ))}
            </div>
            {newThreadType==="group"
              ? <div><label style={LBL}>Mannschaft</label><select className="input" value={newThreadTeam} onChange={e=>setNewThreadTeam(e.target.value)}>{teams.map(t=>{ if (!t) return null; return <option key={t.id} value={t.name}>{safeStr(t.name)}</option> })}</select></div>
              : <div><label style={LBL}>Empfänger</label><select className="input" value={newThreadRecipientId} onChange={e=>setNewThreadRecipientId(e.target.value)}><option value="">Bitte wählen...</option>{allUsers.filter(u => u && u.id !== user?.uid).map(u => ( <option key={u.id} value={u.id}>{safeStr(u.name || u.email)}</option> ))}</select></div>
            }
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowNewThread(false)}>Abbrechen</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={createThread} disabled={newThreadType==="group"?!newThreadTeam:!newThreadRecipientId}>Chat starten</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ APP-DATENSCHUTZ MODAL ════ */}
      {showPrivacyModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowPrivacyModal(false)}>
          <div className="modal">
            <div style={{height:4,background:`linear-gradient(90deg,${B.teal},${B.tealDark})`,borderRadius:"4px 4px 0 0",margin:"-30px -30px 22px"}}/>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>App-Datenschutz</h2>
            
            <div style={{fontSize: 14, color: B.charcoal, fontFamily: "'Barlow', sans-serif", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 12}}>
              <p>Diese Web-App des TV Hindelang e.V. nutzt zur Bereitstellung ihrer Funktionen ausgewählte Dienste, die Daten europarechtskonform (DSGVO) verarbeiten:</p>
              
              <div>
                <strong>1. Hosting & Statistik (Vercel Inc.):</strong><br/>
                Die App wird auf Servern von Vercel gehostet. Beim Aufruf werden technisch bedingt Verbindungsdaten (wie die anonymisierte IP-Adresse) übertragen. Zur Auswertung der App-Nutzung verwenden wir Vercel Web Analytics, was komplett ohne Cookies und ohne persönliches Tracking (Tracking-frei) funktioniert.
              </div>
              
              <div>
                <strong>2. Benutzerkonten & Datenbank (Google Firebase):</strong><br/>
                Für den Login-Bereich, die Speicherung von Terminen, News, Chat-Nachrichten und Mannschaftszuordnungen nutzen wir Google Firebase (Serverstandort Europa). Dabei werden E-Mail-Adressen, verschlüsselte Passwörter sowie die von den Nutzern eingegebenen Profil-Namen sicher verarbeitet.
              </div>
              
              <div>
                <strong>3. Speicherung auf dem Gerät (Local Storage):</strong><br/>
                Diese App setzt keine Werbe-Cookies. Es werden lediglich technisch zwingend notwendige Daten (z.B. der aktuelle Login-Status) im lokalen Speicher deines Browsers abgelegt, damit du nicht bei jedem Öffnen dein Passwort neu eingeben musst.
              </div>
            </div>

            <button className="btn btn-primary" style={{width:"100%", marginTop: 24}} onClick={() => setShowPrivacyModal(false)}>Verstanden & Schließen</button>
          </div>
        </div>
      )}

      {/* ── UNSICHTBARER VERCEL ZÄHLER ── */}
      <Analytics />

    </div>
  );
}
