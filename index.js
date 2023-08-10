'use strict';
const ADB = require('appium-adb').ADB;
const DaijishouDebugClient = require('./lib/daijishou_debug_client');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  


async function run() {
    const adb = await ADB.createADB();

    
    let devices = await adb.getConnectedDevices();
    if(devices.length>1) {
        console.log('There are more than 1 devices. Please select one by index.');
        devices.forEach((device, index)=> {
            console.log(`${index} ${device.udid} ${device.state}`);
        });
        const index = parseInt(await new Promise(resolve => {readline.question("Which device do you want?", resolve)}))
        adb.setDevice(devices[index])
    }
    readline.close()
    
    // await adb.reversePort(PORT, PORT);
    console.log(await adb.getForwardList());

    const daijishouDebugClient = new DaijishouDebugClient(adb);

    daijishouDebugClient.heartbeat((err) => {
        console.log(err);
        console.log("heartbeat 1");
    });
    daijishouDebugClient.heartbeat((err) => {
        console.log(err);
        console.log("heartbeat 2");
    });

    daijishouDebugClient.console("\\drive list all", (err, result) => {
        console.log(err);
        console.log(result);
        
    });

    daijishouDebugClient.console("\\echo 123", (err, result) => {
        console.log(err);
        console.log(result);
    });

    daijishouDebugClient.console("\\echo 123", (err, result) => {
        console.log(err);
        console.log(result);
    });
}
run()