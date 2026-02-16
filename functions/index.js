const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.restoreProfiles = functions.https.onRequest(async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);

    let created = 0;

    for (const user of listUsersResult.users) {
      const profileRef = admin.firestore().collection("profiles").doc(user.uid);
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        await profileRef.set({
          fullName: user.displayName || user.email.split("@")[0],
          role: "Technician",
          bio: "",
          skills: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        created++;
      }
    }

    res.send(`Profiles restored. Created: ${created}`);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.toString());
  }
});
