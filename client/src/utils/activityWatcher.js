let warningTimer;
let logoutTimer;
let isWarningShown = false;

export function startInactivityWatcher(timeout = 3600000, warningBefore = 300000) {
  const warningTime = timeout - warningBefore;

  const clearTimers = () => {
    clearTimeout(warningTimer);
    clearTimeout(logoutTimer);
  };

  const resetTimers = () => {
    clearTimers();

    if (isWarningShown) {
      hideInactivityWarning();
      isWarningShown = false;
    }

    warningTimer = setTimeout(() => {
      showInactivityWarning(); // display warning at 25 minutes
      isWarningShown = true;
    }, warningTime);

    logoutTimer = setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      hideInactivityWarning();
      window.dispatchEvent(new CustomEvent("sessionExpired"));
    }, timeout);
  };

  const events = ["mousemove", "keydown", "mousedown", "touchstart"];
  events.forEach((event) =>
    document.addEventListener(event, resetTimers)
  );

  resetTimers();
}

function showInactivityWarning() {
  const existing = document.getElementById("inactivity-warning");
  if (existing) return;

  const div = document.createElement("div");
  div.id = "inactivity-warning";
  div.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ffc107;
    color: #000;
    padding: 16px 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: sans-serif;
  `;
  div.innerHTML = `
    <strong>⚠️ You’ve been inactive.</strong><br />
    You will be logged out in 5 minutes.<br/>
    <button id="stay-logged-in" style="
      margin-top: 8px;
      padding: 6px 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    ">Stay Logged In</button>
  `;

  document.body.appendChild(div);

  document.getElementById("stay-logged-in").addEventListener("click", () => {
    hideInactivityWarning();
    isWarningShown = false;
    const event = new Event("mousemove"); // simulate activity
    document.dispatchEvent(event);
  });
}

function hideInactivityWarning() {
  const div = document.getElementById("inactivity-warning");
  if (div) div.remove();
}
