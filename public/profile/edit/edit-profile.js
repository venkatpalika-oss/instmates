import { auth, db, storage } from "/assets/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const form = document.getElementById("editProfileForm");
const fileInput = document.getElementById("profilePhoto");
const preview = document.getElementById("imagePreview");
const cropImage = document.getElementById("cropImage");
const cropContainer = document.getElementById("cropContainer");
const cropBtn = document.getElementById("cropBtn");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const deletePhotoBtn = document.getElementById("deletePhotoBtn");
const toast = document.getElementById("toast");

let cropper;
let croppedBlob = null;
let existingPhotoURL = null;

/* ================= TOAST ================= */

function showToast(message, type = "success") {
  toast.innerHTML = message;
  toast.style.background = type === "success" ? "#28a745" : "#dc3545";
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 4000);
}

/* ================= LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const snap = await getDoc(doc(db, "profiles", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("fullName").value = data.basicInfo?.fullName || "";
  document.getElementById("headline").value = data.basicInfo?.headline || "";
  document.getElementById("location").value = data.basicInfo?.location || "";
  document.getElementById("specialization").value = data.professional?.specialization || "";
  document.getElementById("analyzersWorked").value =
    (data.professional?.analyzersWorked || []).join(", ");

  existingPhotoURL = data.basicInfo?.profilePhoto || null;

  if (existingPhotoURL) {
    preview.src = existingPhotoURL;
    preview.style.display = "block";
    deletePhotoBtn.style.display = "inline-block";
  }
});

/* ================= CHANGE PHOTO ================= */

changePhotoBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    cropImage.src = reader.result;
    cropContainer.style.display = "block";

    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1
    });
  };
  reader.readAsDataURL(file);
});

/* ================= CROP IMAGE ================= */

cropBtn.addEventListener("click", () => {
  if (!cropper) return;

  cropper.getCroppedCanvas({
    width: 300,
    height: 300
  }).toBlob((blob) => {
    croppedBlob = blob;
    preview.src = URL.createObjectURL(blob);
    preview.style.display = "block";
    cropContainer.style.display = "none";
  });
});

/* ================= DELETE PHOTO ================= */

deletePhotoBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const storageRef = ref(storage, `profilePhotos/${user.uid}`);
    await deleteObject(storageRef);

    await updateDoc(doc(db, "profiles", user.uid), {
      "basicInfo.profilePhoto": null
    });

    preview.style.display = "none";
    deletePhotoBtn.style.display = "none";
    existingPhotoURL = null;

    showToast("Profile photo deleted");

  } catch (err) {
    console.error(err);
    showToast("Error deleting photo", "error");
  }
});

/* ================= PROFILE COMPLETION ================= */

function calculateCompletion(data) {
  let total = 6;
  let score = 0;

  if (data.basicInfo?.fullName) score++;
  if (data.basicInfo?.headline) score++;
  if (data.basicInfo?.location) score++;
  if (data.professional?.specialization) score++;
  if (data.professional?.analyzersWorked?.length) score++;
  if (data.basicInfo?.profilePhoto) score++;

  return Math.round((score / total) * 100);
}

/* ================= SAVE PROFILE ================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const saveBtn = form.querySelector("button[type='submit']");
  saveBtn.disabled = true;
  saveBtn.innerText = "Saving...";

  try {

    const fullName = document.getElementById("fullName").value;
    const headline = document.getElementById("headline").value;
    const location = document.getElementById("location").value;
    const specialization = document.getElementById("specialization").value;
    const analyzersWorked = document
      .getElementById("analyzersWorked")
      .value.split(",")
      .map(s => s.trim())
      .filter(Boolean);

    let photoURL = existingPhotoURL;

    if (croppedBlob) {
      const storageRef = ref(storage, `profilePhotos/${user.uid}`);
      await uploadBytes(storageRef, croppedBlob);
      photoURL = await getDownloadURL(storageRef);
    }

    const profileData = {
      basicInfo: {
        fullName,
        headline,
        location,
        profilePhoto: photoURL
      },
      professional: {
        specialization,
        analyzersWorked
      }
    };

    const completion = calculateCompletion(profileData);

    await updateDoc(doc(db, "profiles", user.uid), {
      ...profileData,
      profileStatus: {
        isPublic: true,
        completionPercent: completion
      }
    });

    saveBtn.innerText = "✔ Saved";
    showToast("Profile updated successfully!");

    setTimeout(() => {
      window.location.href = `/profile/?uid=${user.uid}`;
    }, 2000);

  } catch (err) {
    console.error(err);
    showToast("Error saving profile", "error");
    saveBtn.disabled = false;
    saveBtn.innerText = "Save Profile";
  }
});