'use strict';
const ADB = require('appium-adb').ADB;
const net = require('net');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
const PORT = 19487;


async function run() {
    const adb = await ADB.createADB();

    async function close() {
        console.log('Removing forwards.');
        await adb.removePortForward(PORT)
        console.log('Forwards remain:');
        console.log(await adb.getForwardList());
    }
    
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
    console.log('Forwarding...');
    await adb.forwardPort(PORT, PORT);
    // await adb.reversePort(PORT, PORT);
    console.log(await adb.getForwardList());

    

    const client = new net.Socket();
    client.connect(PORT, '127.0.0.1', function() {
        console.log('Connected.');
        client.write('Hello, server! Love, Client.\n');
    });
    client.on('data', function(data) {
        console.log('Received: ' + data);
        client.destroy(); // kill client after server's response
    });
    
    client.on('close', function() {
        console.log('Connection closed.');
        close();
    });


}
run()