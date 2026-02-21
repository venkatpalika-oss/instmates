import { auth, db } from "/assets/js/firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const storage = getStorage();
const form = document.getElementById("editProfileForm");

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    window.location.href = "/login/";
    return;
  }

  const profileRef = doc(db, "profiles", user.uid);
  const snap = await getDoc(profileRef);

  if (snap.exists()) {
    const data = snap.data();

    document.getElementById("fullName").value =
      data.basicInfo?.fullName || "";

    document.getElementById("headline").value =
      data.basicInfo?.headline || "";

    document.getElementById("location").value =
      data.basicInfo?.location || "";

    document.getElementById("specialization").value =
      data.professional?.specialization || "";

    document.getElementById("analyzersWorked").value =
      (data.professional?.analyzersWorked || []).join(",");
  }

});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const fullName = document.getElementById("fullName").value;
  const headline = document.getElementById("headline").value;
  const location = document.getElementById("location").value;
  const specialization = document.getElementById("specialization").value;
  const analyzersWorked = document
    .getElementById("analyzersWorked")
    .value.split(",")
    .map(s => s.trim())
    .filter(Boolean);

  let photoURL = null;
  const fileInput = document.getElementById("profilePhoto");

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const storageRef = ref(storage, `profilePhotos/${user.uid}`);
    await uploadBytes(storageRef, file);
    photoURL = await getDownloadURL(storageRef);
  }

  await updateDoc(doc(db, "profiles", user.uid), {
    basicInfo: {
      fullName,
      headline,
      location,
      ...(photoURL && { profilePhoto: photoURL })
    },
    professional: {
      specialization,
      analyzersWorked
    },
    profileStatus: {
      isPublic: true,
      completionPercent: 80
    }
  });

  window.location.href = `/profile/?uid=${user.uid}`;
});