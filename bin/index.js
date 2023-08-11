#! /usr/bin/env node
'use strict';

const commandLineArgs = require('command-line-args')
const ADB = require('appium-adb').ADB;
const DaijishouDebugClient = require('../lib/daijishou_debug_client');

  
const mainDefinitions = [
    { name: 'command', defaultOption: true }
  ]

const mainOptions = commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true })
const argv = mainOptions._unknown || []


async function getADB() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
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
    return adb
}

if (mainOptions.command === 'console') {
    getADB().then((adb) => {
        const daijishouDebugClient = new DaijishouDebugClient(adb);
        const command = argv.join(" ")
        daijishouDebugClient.console(command, (err, result) => {
            daijishouDebugClient.disconnect()
            if(err) {
                console.log(err)
                return
            }
            console.log(``)
            console.log(`Command "${command}" returned with status code: ${result.statusCode}.\n\n${result.message}`)
            console.log(``)
        })
    })
}
else if (mainOptions.command === 'cli') {
    getADB().then((adb) => {
        const daijishouDebugClient = new DaijishouDebugClient(adb);
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        daijishouDebugClient.connect();
        const nextCommand = () => {
            readline.question(" > ", (command) => {
                // console.log(command);
                if(command=="exit") {
                    readline.close()
                    daijishouDebugClient.disconnect()
                }
                else if (command.startsWith('\\files list files ')) {

                }
                else if (command.startsWith('\\files delete ')) {

                }
                else if (command.startsWith('\\files push ')) {

                }
                else if (command.startsWith('\\files pull ')) {

                }
                else daijishouDebugClient.console(command, (err, result) => {
                    if(err) {
                        console.log(err)
                        nextCommand();
                        return
                    }
                    console.log(``)
                    console.log(`Command "${command}" returned with status code: ${result.statusCode}.\n\n${result.message}`)
                    console.log(``)
                    nextCommand();
                })
            })
        }
        nextCommand();
    })
}
else {
    console.log('Unknown command.')
}