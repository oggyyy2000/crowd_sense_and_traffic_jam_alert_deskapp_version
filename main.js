const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const url = require("url");
const path = require("path");
const fs = require("fs");

let loadingWindow = null;
let myWindow = null;
let windowCount = 0;

const configFilePath = "/tmp/first_launch.json";

function isFirstLaunch() {
  if (!fs.existsSync(configFilePath)) {
    return false;
  } else {
    return true;
  }
}

function createMainWindow() {
  const shouldQuit = !app.requestSingleInstanceLock();

  if (shouldQuit) {
    app.quit(); // Quit if another instance is already running
  } else {
    app.on("second-instance", () => {
      // Someone tried to start a second instance, focus our window.
      if (myWindow) {
        if (myWindow.isMinimized()) myWindow.restore();
        myWindow.focus();
      }
    });

    // Create a temporary loading window
    loadingWindow = new BrowserWindow({
      width: 650, // Adjust width and height as needed
      height: 400,
      frame: false, // Remove window frame for a cleaner look
      show: false, // Don't show it initially
      alwaysOnTop: true, // Keep it on top of other windows
    });

    loadingWindow.loadFile("assets/loading.html"); // Load your loading page
    windowCount++;
    loadingWindow.show();

    setTimeout(() => {
      if (loadingWindow) {
        app.quit();
        windowCount--;
        loadingWindow = null;
      }

      const mainWindow = new BrowserWindow({
        title: "VSH_tech_workstation ",
        // titleBarStyle: "hidden", // Hide the title bar
        autoHideMenuBar: true, // Hide the menu bar only
        width: 1680,
        height: 920,
      });
      mainWindow.maximize();

      // mainWindow.webContents.openDevTools();

      const startUrl = url.format({
        pathname: path.join(
          __dirname,
          "./reactBuild/build/index.html"
        ),
        protocol: "file",
      });

      windowCount++;
      mainWindow.loadURL(startUrl);
    }, 8000);
  }
}

// run this as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

app.whenReady().then(() => {
  let firstLaunch = isFirstLaunch();
  console.log("firstLaunch: ", firstLaunch);
  if (!firstLaunch) {
    exec(
      "/home/tuan47/tuan/BCA_demo/FE_may_tram_BCA/crowd_sense_and_traffic_jam_alert_deskapp_version/run_app.sh",
      (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      }
    );
    console.log("Run .sh");
    fs.writeFileSync(configFilePath, JSON.stringify({ firstLaunch: true }));
  } else {
    console.log("Has already launch");
    if (myWindow) {
      if (myWindow.isMinimized()) myWindow.restore();
      myWindow.focus();
    }
  }
  createMainWindow();
});

async function callApiBeforeQuit() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/killmultipleprocesses/"
    );
    const responseObject = await response.json();
    return responseObject;
  } catch (error) {
    console.error("API call failed:", error);
  }
}
app.on("will-quit", async (event) => {
  windowCount--;
  console.log("windowCountFinal:", windowCount);
  // Call your API function before quitting
  if (windowCount == 0) {
    callApiBeforeQuit();
    fs.unlink(configFilePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully!");
      }
    });
  } else {
    console.log("Still have window opened");
    if (myWindow) {
      if (myWindow.isMinimized()) myWindow.restore();
      myWindow.focus();
    }
  }
});
