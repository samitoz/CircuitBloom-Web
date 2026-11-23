// Circuit Bloom Web authentication. No credentials or progress are sent by this module.
// Firebase modules are loaded only after the player opens the optional account panel.
const config = Object.freeze({
  apiKey: "AIzaSyAhPyvKgV2wWsIEikOsH6sfwfGUyRg5m_M",
  authDomain: "circuitbloom-6fa98.firebaseapp.com",
  projectId: "circuitbloom-6fa98",
  storageBucket: "circuitbloom-6fa98.firebasestorage.app",
  messagingSenderId: "371169217353",
  appId: "1:371169217353:web:7b59f5467acce136896898"
});

const css = document.createElement("style");
css.textContent = `
#cb-account-toggle {position:fixed;right:12px;top:12px;z-index:8;background:#17243a;color:#f2f6ff;border:1px solid #62e5d3;border-radius:16px;padding:9px 13px;font:600 13px system-ui;cursor:pointer}
#cb-account-panel {position:fixed;inset:0;z-index:20;background:#090f1eea;display:none;align-items:center;justify-content:center;padding:20px;font:16px system-ui;color:#f2f6ff}
#cb-account-panel.open {display:flex}
#cb-account-card {background:#17243a;border:1px solid #354968;border-radius:22px;max-width:360px;width:100%;padding:25px;box-sizing:border-box;text-align:center}
#cb-account-card button {border:0;border-radius:12px;padding:13px;margin:7px 0;width:100%;background:#176e70;color:white;font:600 15px system-ui;cursor:pointer}
#cb-account-card button:disabled {opacity:.5;cursor:wait}
#cb-account-card button.secondary {background:#263651}
#cb-account-card p {font-size:13px;line-height:1.5;color:#b9c9dc;overflow-wrap:anywhere}
`;
document.head.append(css);
const toggle = document.createElement("button");
toggle.id = "cb-account-toggle";
toggle.type = "button";
toggle.textContent = "ACCOUNT";
toggle.setAttribute("aria-label", "Open Circuit Bloom account");
const panel = document.createElement("div");
panel.id = "cb-account-panel";
panel.setAttribute("role", "dialog");
panel.setAttribute("aria-modal", "true");
panel.setAttribute("aria-label", "Circuit Bloom account");
panel.innerHTML = `<div id="cb-account-card">
  <h2>YOUR ACCOUNT</h2><p id="cb-auth-state">Guest mode. Your progress stays on this device.</p>
  <button id="cb-google-login" type="button">Continue with Google</button>
  <button id="cb-logout" type="button" class="secondary" hidden>Sign out</button>
  <button id="cb-account-close" type="button" class="secondary">Back to game</button>
  <p>Cloud save is not enabled yet. Signing in does not transfer your game progress.</p>
</div>`;
document.body.append(toggle, panel);
const state = panel.querySelector("#cb-auth-state");
const login = panel.querySelector("#cb-google-login");
const logout = panel.querySelector("#cb-logout");
const close = () => { panel.classList.remove("open"); toggle.focus(); };
const openAccount = () => {
  panel.classList.add("open");
  login.disabled = true;
  getFirebaseAuth().then(() => { login.disabled = false; }).catch(() => {
    state.textContent = "Google sign-in needs an internet connection. Guest play is available.";
    login.disabled = false;
  });
};
window.circuitBloomOpenAccount = openAccount;
toggle.hidden = true;
toggle.addEventListener("click", openAccount);
panel.querySelector("#cb-account-close").addEventListener("click", close);
panel.addEventListener("click", (event) => { if (event.target === panel) close(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });

let authPromise;
function getFirebaseAuth() {
  if (!authPromise) {
    authPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js")
    ]).then(([appModule, authModule]) => {
      const app = appModule.initializeApp(config);
      const auth = authModule.getAuth(app);
      authModule.onAuthStateChanged(auth, user => {
        state.textContent = user ? "Signed in: " + (user.email || user.displayName || "Google account") : "Guest mode. Your progress stays on this device.";
        login.hidden = !!user;
        logout.hidden = !user;
        toggle.textContent = user ? "ACCOUNT ✓" : "ACCOUNT";
      });
      return { auth, authModule };
    }).catch(err => { authPromise = null; throw err; });
  }
  return authPromise;
}
login.addEventListener("click", async () => {
  login.disabled = true;
  state.textContent = "Connecting to Google…";
  try {
    const { auth, authModule } = await getFirebaseAuth();
    await authModule.signInWithPopup(auth, new authModule.GoogleAuthProvider());
  } catch (err) {
    state.textContent = err.code === "auth/popup-closed-by-user"
      ? "Sign-in canceled. Guest play is still available."
      : "Sign-in unavailable (" + (err.code || "connection error") + "). Check Google provider and authorized domain.";
  } finally { login.disabled = false; }
});
logout.addEventListener("click", async () => {
  try {
    const { auth, authModule } = await getFirebaseAuth();
    await authModule.signOut(auth);
  } catch { state.textContent = "Could not sign out. Please try again."; }
});
