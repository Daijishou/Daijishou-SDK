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
                // \files list files daijishou-file://files
                else if (command.startsWith('\\fileop list ')) {
                    const uriString = command.replace('\\fileop list ', '')
                    daijishouDebugClient.listFiles(uriString, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`List files of "${uriString}" returned with status code: ${result.statusCode}.`)
                        if(result.statusCode == daijishouDebugClient.FILES_SUB_OPERATION_SUCCEED_RESULT_STATUS_BYTE_CODE) result.files.forEach((file) => {
                            const line = (file.isDirectory?"d ":"  ")+String(file.size/1024n).padStart(8,' ')+ 'KB ' + file.name // +' '+file.path
                            console.log(line)
                        });
                        console.log(``)
                        // console.log(result)
                        nextCommand();
                    });
                }
                else if (command.startsWith('\\fileop delete ')) {
                    const uriString = command.replace('\\fileop delete ', '')
                    daijishouDebugClient.deleteFile(uriString, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`Delete file "${uriString}" returned with status code: ${result.statusCode}.`)
                        console.log(``)
                        // console.log(result)
                        nextCommand();
                    });
                }
                // \fileop push ./lib daijishou-file://cache/push_test
                // \fileop push ./index.js daijishou-file://cache/push_test
                else if (command.startsWith('\\fileop push ')) {
                    const pathAndUriString = command.replace('\\fileop push ', '')
                    const pathAndUri = pathAndUriString.split(' ')
                    const localPath = pathAndUri[0]
                    const RemoteUriString = pathAndUri[1]

                    // const path = require('path');
                    daijishouDebugClient.pushFile(localPath, RemoteUriString, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`Push file "${localPath}" to "${RemoteUriString}" returned with status code: ${result.statusCode}.`)
                        console.log(``)
                        // console.log(result)
                        nextCommand();
                    });
                }
                else if (command.startsWith('\\fileop pull ')) {

                }
                else daijishouDebugClient.console(command, (err, result) => {
                    if(err) {
                        console.log(err)
                        nextCommand();
                        return
                    }
                    console.log(``)
                    console.log(`Command "${command}" returned with status code: ${result.statusCode}.\n${result.message}`)
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