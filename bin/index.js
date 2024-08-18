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
            readline.question("💻 dai console > ", (command) => {
                // console.log(command);
                if(command=="exit") {
                    readline.close()
                    daijishouDebugClient.disconnect()
                }
                // \filesop list files daijishou-file://files/
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
                // \fileop push ./test_files/manager_runtime daijishou-file://extension_manager
                // \extensions js_file daijishou-file://extension_manager/index.js
                // \fileop push ./index.js daijishou-file://cache/push_test
                else if (command.startsWith('\\fileop push ')) {
                    const pathAndUriString = command.replace('\\fileop push ', '')
                    const pathAndUri = pathAndUriString.split(' ')
                    const localPath = pathAndUri[0]
                    const RemoteUriString = pathAndUri[1]

                    daijishouDebugClient.pushFile(localPath, RemoteUriString, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`Push file from "${localPath}" to "${RemoteUriString}" returned with status code: ${result.statusCode}.`)
                        console.log(``)
                        nextCommand();
                    });
                }
                // \fileop pull daijishou-file://extension_manager ./test_files/pull/manager_runtime
                // \fileop pull daijishou-file://extension_manager/index.js ./test_files/pull/manager_runtime
                else if (command.startsWith('\\fileop pull ')) {
                    const pathAndUriString = command.replace('\\fileop pull ', '')
                    const pathAndUri = pathAndUriString.split(' ')
                    const RemoteUriString = pathAndUri[0]
                    const localPath = pathAndUri[1]
                    if(!localPath) {
                        console.log(``)
                        console.log(`Please specify local path.`)
                        console.log(``)
                        nextCommand();
                        return
                    }
                    daijishouDebugClient.pullFile(RemoteUriString, localPath, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`Pull file from "${RemoteUriString}" to "${localPath}" returned with status code: ${result.statusCode}.`)
                        console.log(``)
                        nextCommand();
                    });
                }
                else if (command.startsWith('\\install_ext ')) {
                    daijishouDebugClient.installExtension(pathToExtension, (err, result) => {
                        if(err) {
                            console.log(err)
                            nextCommand();
                            return
                        }
                        console.log(``)
                        console.log(`Install extension from path "${pathToExtension}" succeed.`)
                        console.log(``)
                        nextCommand();
                    });
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

// \js showRetroAchievementsGameDialogByGameId(20562, (isShown) => {})
// \js showPlayableItemChooserDialog((playableItem) => { console.log(playableItem.name)})
// \js showAcknowledgementDialog("Are you sure?", "The action will cause bla bla bla...", (boolean) => {console.log(`Acknowledged: ${boolean}`)})