'use strict';
const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function DaijishouDebugClient(adb, verbose=false) {
    this._tcpClient = null;
    this._adb = adb;
    this._verbose = verbose;
    this._lifecycle = this.IS_DISCONNECTED_LIFECYCLE;
    this._onConnectCallacks = [];
    this._taskQueue = [];
    this._executingTask = null;
    this._runningOperation = null;
}

DaijishouDebugClient.prototype.BYTES_CHUNK_SIZE = 1024*512 // 512 KB
DaijishouDebugClient.prototype.IS_DISCONNECTED_LIFECYCLE = 0
DaijishouDebugClient.prototype.IS_CONNECTING_LIFECYCLE = 1
DaijishouDebugClient.prototype.IS_CONNECTED_LIFECYCLE = 2

DaijishouDebugClient.prototype.buildHeartbeatOperation = function() {
    const headerByteCode = 0x00;
    const tcpClient = this._tcpClient
    var cb = null
    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            tcpClient.write(new Uint8Array([headerByteCode]));
        },
        onReadable: () => {
            const resposedByte = tcpClient.read(1);

            this._runningOperation = null;
            if(resposedByte[0] == headerByteCode) cb(null);
            else cb(Error(`Heartbeat byte code mismatched. Code: ${resposedByte[0]}`));
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.listFilesRecursively = function(dir, done) {
    var results = [];
    fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach((file) => {
        file = path.resolve(dir, file);
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            this.listFilesRecursively(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) done(null, results);
          }
        });
      });
    });
};

DaijishouDebugClient.prototype.readByteAsIntFromTcpSocket = function() {
    const Byte = this._tcpClient.read(1);
    if(Byte != null&&Byte.length>0) {
        return Byte[0]
    }
    else return null
}

DaijishouDebugClient.prototype.readIntFromTcpSocket = function() {
    const Bytes = this._tcpClient.read(4);
    if(Bytes != null) {
        return Bytes.readInt32BE()
    }
    else return null
}

DaijishouDebugClient.prototype.writeIntToTcpSocket = function(int) {
    const bytes = Buffer.alloc(4);
    bytes.writeInt32BE(int);
    this._tcpClient.write(bytes);
}

DaijishouDebugClient.prototype.readLongFromTcpSocket = function() {
    const Bytes = this._tcpClient.read(8);
    if(Bytes != null) {
        return Bytes.readBigInt64BE()
    }
    else return null
}

DaijishouDebugClient.prototype.writeLongToTcpSocket = function(long) {
    const bytes = Buffer.alloc(8);
    bytes.writeBigInt64BE(long);
    this._tcpClient.write(bytes);
}

DaijishouDebugClient.prototype.writeStringToTcpSocket = function(string) {
    this.writeIntToTcpSocket(string.length);
    this._tcpClient.write(Buffer.from(string));
}


DaijishouDebugClient.prototype.writeFileToTcpSocketFromFile = function(basePath, relativeFilePath, callback) {
    const tcpClient = this._tcpClient;
    var headerByteCodeRead = null
    var statusCode = null
    //
    const writeFileToTcpSocket = () => {
        const absoluteFilePath = path.join(basePath, relativeFilePath)
        this.writeStringToTcpSocket(relativeFilePath)
        var stats = fs.statSync(absoluteFilePath)
        var fileSizeInBytes = BigInt(stats.size);
        this.writeLongToTcpSocket(fileSizeInBytes);
        // this.writeStringToTcpSocket(relativeFilePath);
        const readableStream = fs.createReadStream(absoluteFilePath);
        const hash = crypto.createHash('sha256');
        readableStream.on('data', (chunk) => {
            hash.update(chunk);
            tcpClient.write(chunk);
        })
        readableStream.on('end', () => {
            tcpClient.write(hash.digest());
        })
    }

    // Override current op.
    const microOperation = {
        onReadable: () => {
            if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
            if(headerByteCodeRead == null) return
            if(statusCode == null) statusCode = this.readByteAsIntFromTcpSocket();
            if(statusCode == null) return
            if(headerByteCodeRead != this.FILE_OPERATION_HEADER_BYTE) throw Error(`Header code mismatched. Code: ${headerByteCodeRead}`);
            if(statusCode==this.FILES_SUB_OPERATION_SUCCEED_RESULT_STATUS_BYTE_CODE) {
                this._runningOperation = replacedOperation
                callback(null);
            }
            else if(statusCode==this.FILES_SUB_CHECKSUM_MISMATCHED_RESULT_STATUS_BYTE_CODE) {
                headerByteCodeRead = null
                statusCode = null
                writeFileToTcpSocket();
            }
            else {
                callback(new Error("Error occured while writing file."));
            }
        }
    }
    const replacedOperation = this._runningOperation
    this._runningOperation = microOperation

    // Execute operation.
    writeFileToTcpSocket()

    
}

DaijishouDebugClient.prototype.readFileFromTcpSocketToFile = function(basePath, filePath) {
    const microOperation = {
        onReadable: () => {
            
        }
    }
    const replacedOperation = this._runningOperation
    this._runningOperation = microOperation
    //
    this._runningOperation = replacedOperation
}

DaijishouDebugClient.prototype.readStringFromTcpSocket = function() {
    if(this._readStringLength == null) this._readStringLength = this.readIntFromTcpSocket();
    const tcpClient = this._tcpClient;
    const readLength = this._readStringResultBytes?this._readStringLength-this._readStringResultBytes.length:this._readStringLength
    const resultBytes = tcpClient.read(readLength);
    if(resultBytes == null) return null
    this._readStringResultBytes = this._readStringResultBytes?Buffer.concat([this._readStringResultBytes, resultBytes]):resultBytes
    if(this._readStringResultBytes == null) return null
    else if(this._readStringResultBytes.length==this._readStringLength) {
        const result = this._readStringResultBytes.toString()
        this._readStringLength = null
        this._readStringResultBytes = null
        return result
    }
    else return null
}

DaijishouDebugClient.prototype.CONSOLE_OPERATION_HEADER_BYTE = 0x02;
DaijishouDebugClient.prototype.buildConsoleOperation = function(command) {
    const headerByteCode = this.CONSOLE_OPERATION_HEADER_BYTE;
    const tcpClient = this._tcpClient
    // console.log(this)
    // console.log(tcpClient)
    var cb = null
    var headerByteCodeRead = null
    var statusCode = null
    var message = null
    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            tcpClient.write(Buffer.from([headerByteCode]));
            this.writeStringToTcpSocket(command);
        },
        onReadable: () => {
            if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
            if(headerByteCodeRead == null) return
            if(statusCode == null) statusCode = this.readIntFromTcpSocket();
            if(statusCode == null) return
            if(message == null) message = this.readStringFromTcpSocket();
            if(message == null) return

            this._runningOperation = null;
            cb(null, {
                statusCode: statusCode,
                message: message
            });
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err, null);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.FILE_OPERATION_HEADER_BYTE = 0x04;

DaijishouDebugClient.prototype.LIST_FILES_SUB_OPERATION_BYTE_CODE = 0x01;
DaijishouDebugClient.prototype.DELETE_FILE_SUB_OPERATION_BYTE_CODE = 0x02;
DaijishouDebugClient.prototype.PUSH_FILE_SUB_OPERATION_BYTE_CODE = 0x03;
DaijishouDebugClient.prototype.PULL_FILE_SUB_OPERATION_BYTE_CODE = 0x04;

DaijishouDebugClient.prototype.FILES_SUB_OPERATION_SUCCEED_RESULT_STATUS_BYTE_CODE = 0x00;
DaijishouDebugClient.prototype.FILES_SUB_OPERATION_FAILED_RESULT_STATUS_BYTE_CODE = 0x01;
DaijishouDebugClient.prototype.FILES_SUB_OPERATION_NO_SUCH_FILE_RESULT_STATUS_BYTE_CODE = 0x02;
DaijishouDebugClient.prototype.FILES_SUB_OPERATION_ACCESS_DENIED_RESULT_STATUS_BYTE_CODE = 0x03;
DaijishouDebugClient.prototype.FILES_SUB_CHECKSUM_MISMATCHED_RESULT_STATUS_BYTE_CODE = 0x05;

DaijishouDebugClient.prototype.buildFileListFilesSubOperation = function(uriString) {
    const headerByteCode = this.FILE_OPERATION_HEADER_BYTE;
    const tcpClient = this._tcpClient
    // console.log(this)
    // console.log(tcpClient)
    var cb = null
    var headerByteCodeRead = null
    var statusCode = null
    var fileCount = null
    var filesRead = 0

    var fileName = null
    var fileIsDirectory = null
    var fileSize = null
    var filePath = null

    var files = [];

    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            tcpClient.write(Buffer.from([headerByteCode, this.LIST_FILES_SUB_OPERATION_BYTE_CODE]));
            this.writeStringToTcpSocket(uriString);
        },
        onReadable: () => {
            if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
            if(headerByteCodeRead == null) return
            if(statusCode == null) statusCode = this.readByteAsIntFromTcpSocket();
            if(statusCode == null) return
            if(statusCode!=this.FILES_SUB_OPERATION_SUCCEED_RESULT_STATUS_BYTE_CODE) {
                this._runningOperation = null;
                return cb(null, {
                    statusCode: statusCode
                });
            }
            if(fileCount == null) fileCount = this.readIntFromTcpSocket();
            if(fileCount == null) return

            while(filesRead<fileCount) {
                // console.log(fileCount);
                // console.log(filesRead);
                // console.log(fileSize);
                // console.log(fileName);
                // console.log(filePath);

                // if(fileIsDirectory == null) fileIsDirectory = (this.readByteAsIntFromTcpSocket()==1)?true:false;
                if(fileIsDirectory == null) fileIsDirectory = this.readByteAsIntFromTcpSocket();
                if(fileIsDirectory == null) return

                if(fileSize == null) fileSize = this.readLongFromTcpSocket();
                if(fileSize == null) return

                if(fileName == null) fileName = this.readStringFromTcpSocket();
                if(fileName == null) return
    
                if(filePath == null) filePath = this.readStringFromTcpSocket();
                if(filePath == null) return
    
                filesRead += 1;
                files.push({
                    name: fileName,
                    isDirectory: fileIsDirectory,
                    size: fileSize,
                    path: filePath,
                })
                fileName = null;
                fileIsDirectory = null;
                fileSize = null;
                filePath = null;
            }
            this._runningOperation = null;
            cb(null, {
                statusCode: statusCode,
                files: files
            });
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err, null);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.buildFileDeleteFileSubOperation = function(uriString) {
    const headerByteCode = this.FILE_OPERATION_HEADER_BYTE;
    const tcpClient = this._tcpClient

    var cb = null
    var headerByteCodeRead = null
    var statusCode = null

    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            // console.log(DELETE_FILE_SUB_OPERATION_BYTE_CODE);
            tcpClient.write(Buffer.from([headerByteCode, this.DELETE_FILE_SUB_OPERATION_BYTE_CODE]));
            this.writeStringToTcpSocket(uriString);
        },
        onReadable: () => {
            if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
            if(headerByteCodeRead == null) return
            if(statusCode == null) statusCode = this.readByteAsIntFromTcpSocket();
            if(statusCode == null) return
            this._runningOperation = null;
            cb(null, {
                statusCode: statusCode
            });
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err, null);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.buildFilePushFileSubOperation = function(localPath, RemoteUriString) {
    const headerByteCode = this.FILE_OPERATION_HEADER_BYTE;
    const tcpClient = this._tcpClient

    var cb = null
    var headerByteCodeRead = null
    var statusCode = null
    const isDirectory = fs.lstatSync(localPath).isDirectory()
    var files = isDirectory?null:[localPath]
    const finalLocalPath = isDirectory?localPath:path.dirname(localPath)

    const startPushing = () => {
        var index = -1;

        const writeNextFile = () => {
            index += 1;
            if(index>=files.length) {
                // Wait for onReadable.
                return
            }
            const file = files[index];
            this.writeFileToTcpSocketFromFile(finalLocalPath, path.relative(finalLocalPath, file), (err) => {
                if(err) {
                    cb(err);
                    this.disconnectTCP();
                    return
                }
                writeNextFile();
            });
        }
        writeNextFile();
    }

    const firstOnReadable = () => {
        if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
        if(headerByteCodeRead == null) return
        if(statusCode == null) statusCode = this.readByteAsIntFromTcpSocket();
        if(statusCode == null) return
        if(statusCode == this.FILES_SUB_OPERATION_SUCCEED_RESULT_STATUS_BYTE_CODE);
        headerByteCodeRead = null
        statusCode = null
        operation.onReadable = secondOnReadable
        startPushing();
    }

    const secondOnReadable = () => {
        if(headerByteCodeRead == null) headerByteCodeRead = this.readByteAsIntFromTcpSocket();
        if(headerByteCodeRead == null) return
        if(statusCode == null) statusCode = this.readByteAsIntFromTcpSocket();
        if(statusCode == null) return
        this._runningOperation = null;
        cb(null, {
            statusCode: statusCode
        });
    }

    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            // console.log(DELETE_FILE_SUB_OPERATION_BYTE_CODE);
            const next = () => {
                tcpClient.write(Buffer.from([headerByteCode, this.PUSH_FILE_SUB_OPERATION_BYTE_CODE]));
                this.writeStringToTcpSocket(RemoteUriString);
                this.writeIntToTcpSocket(files.length);
            }
            if(isDirectory) this.listFilesRecursively(finalLocalPath, (err, allFiles) => {
                if(err) {
                    cb(err);
                    return
                }
                if(allFiles.length == 0) {
                    cb(new Error("The path contains no files."));
                    return
                }
                files = allFiles;
                next();
            }) 
            else next()
        },
        onReadable: firstOnReadable,
        onError: (err) => {
            this._runningOperation = null;
            cb(err, null);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.PORT = 19487;
DaijishouDebugClient.prototype.HOSTNAME = "127.0.0.1";

DaijishouDebugClient.prototype.log = function(message) {
    if(this._verbose) console.log(`[DaijishouDebugClient] ${message}`);
}

DaijishouDebugClient.prototype.closeADB = function(callback) {
    const run = async () => {
        this.log('Closing up ADB...');
        const adb = this._adb
        this.log('Removing forwards.');
        await adb.removePortForward(this.PORT)
        this.log('Forwards remain:');
        this.log(await adb.getForwardList());
        if(callback) callback();
    }
    try {
        run();
    }
    catch (err) {
        callback(err);
    }
}

DaijishouDebugClient.prototype.startADB = function(callback) {
    const run = async () => {
        this.log('Setting up ADB...');
        const adb = this._adb
        await adb.forwardPort(this.PORT, this.PORT);
        callback(false);
    }
    try {
        run();
    }
    catch (err) {
        callback(err);
    }
}

DaijishouDebugClient.prototype.tcpOnReadable = function() {
    this._onConnectCallacks.forEach((it) => {
        it();
    });
    this._onConnectCallacks = [];
    const tcpClient = this._tcpClient;
    if(this._lifecycle == this.IS_CONNECTING_LIFECYCLE) {
        const byte = tcpClient.read(1)
        // console.log(123);
        if(byte!=null) {
            this._lifecycle = this.IS_CONNECTED_LIFECYCLE;
            this.addTaskToExecutionQueue(null);
        }
    }
    else if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) {
        const runningOperation = this._runningOperation
        if(runningOperation) {
            runningOperation.onReadable();
        }
        else {
            const data = this._tcpClient.read()
            if(data == null) {
                
            }
            else if(data.length == 1 && data[0] == 0x00) {
                this.log(`Heartbeat.`)
            }
            else {
                this.log(`Ignore data:`)
                if(this._verbose) console.log(data)
            }
        }
    }
    else this.disconnectTCP();
}

DaijishouDebugClient.prototype.tcpOnClose = function() {
    this._onConnectCallacks.forEach((it) => {
        it(new Error("Connection closed."));
    });
    // console.log(this._taskQueue);
    this._onConnectCallacks = [];
    this.log('Connection closed.');
    this._lifecycle = this.IS_DISCONNECTED_LIFECYCLE;
    this._taskQueue.forEach((it) => {
        it(new Error("Connection closed."), () => {
            if(this._verbose) this.log('A task cannont be executed.');
        });
    });
    this._taskQueue = [];
}

DaijishouDebugClient.prototype.tcpOnError = function(err) {
    this.log(err);
    const runningOperation = this._runningOperation
    if(runningOperation) {
        runningOperation.onError(data);
    }
}


DaijishouDebugClient.prototype.connectTCP = function() {
    const run = async () => {
        if(this._lifecycle != this.IS_DISCONNECTED_LIFECYCLE) return
        this._lifecycle = this.IS_CONNECTING_LIFECYCLE
        this.log('Establishing TCP connection...');
        this._tcpClient = new net.Socket();
        const tcpClient = this._tcpClient;
        // tcpClient.destroy();
        tcpClient.connect(this.PORT, this.HOSTNAME, () => {
            tcpClient.write(new Uint8Array([0]));
        });
        tcpClient.on('readable', this.tcpOnReadable.bind(this));
        tcpClient.on('error', this.tcpOnError.bind(this));
        tcpClient.on('close', this.tcpOnClose.bind(this));
    }
    try {
        run();
    }
    catch (err) {
        this.log(err);
    }
}

DaijishouDebugClient.prototype.disconnectTCP = function() {
    const run = async () => {
        this.log('Disconnecting TCP connection...');
        const tcpClient = this._tcpClient;
        tcpClient.destroy();
    }
    try {
        run();
    }
    catch (err) {
        this.log(err);
    }
}

DaijishouDebugClient.prototype.connect = function(callback) {
    const run = async () => {
        if(this._lifecycle == this.IS_CONNECTING_LIFECYCLE) {
            if(callback) this._onConnectCallacks.push(callback);
        }
        else if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) {
            if(callback) callback(null);
        }
        else if(this._lifecycle == this.IS_DISCONNECTED_LIFECYCLE) this.startADB((err) => {
            if(err) {
                if(callback) callback(err);
            }
            else {
                if(callback) this._onConnectCallacks.push(callback);
                this.connectTCP();
            }
        })
        else callback(new Error("Unknown lifecycle"));
    }
    try {
        run();
    }
    catch (err) {
        callback(err);
    }
};

DaijishouDebugClient.prototype.disconnect = function() {
    this.closeADB()
    this.disconnectTCP()
}

DaijishouDebugClient.prototype.ensureConnection = function(callback) {
    if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) callback(null);
    else this.connect(callback)
}

// Task
DaijishouDebugClient.prototype.addTaskToExecutionQueue = function(task) {
    if(task!=null) this._taskQueue.push(task);
    if(this._lifecycle!=this.IS_CONNECTED_LIFECYCLE) return
    // this.log("addTaskToExecutionQueue exec init");
    const executeNextTask = () => { 
        // this.log("addTaskToExecutionQueue exec next");
        // console.log(this._taskQueue);
        if(this._lifecycle!=this.IS_CONNECTED_LIFECYCLE) return
        else if(this._taskQueue.length>0) {
            this._tcpClient.read();
            this._executingTask = this._taskQueue.shift()
            this._executingTask(null, executeNextTask);
        }
        else {
            this._executingTask = null
        }
    }

    if(this._executingTask == null && this._taskQueue.length>0) {
        // this.log("addTaskToExecutionQueue exec start");
        this._tcpClient.read();
        this._executingTask = this._taskQueue.shift()
        this._executingTask(null, executeNextTask);
    }
}


// Functions

DaijishouDebugClient.prototype.heartbeat = function(callback) {
    this.ensureConnection((err) => {
        if(err) {
            if(callback) callback(err);
            return
        }
        this.addTaskToExecutionQueue((err, finish) => {
            if(err) {
                callback(err);
                return
            }
            this.buildHeartbeatOperation().run((err) => {
                if(callback) callback(err);
                finish();
            });
        });
    })
}

DaijishouDebugClient.prototype.console = function(command, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        this.addTaskToExecutionQueue((err, finish) => {
            if(err) {
                callback(err, null);
                return
            }
            this.buildConsoleOperation(command).run((err, result) => {
                if(callback) callback(err, result);
                finish();
            });
        });
    })
}

DaijishouDebugClient.prototype.DAIJISHOU_FILE_CACHE_BASE_URI = "daijishou-file://cache"
DaijishouDebugClient.prototype.DAIJISHOU_FILE_FILES_BASE_URI = "daijishou-file://files"

DaijishouDebugClient.prototype.listFiles = function(uriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        this.addTaskToExecutionQueue((err, finish) => {
            if(err) {
                callback(err, null);
                return
            }
            this.buildFileListFilesSubOperation(uriString).run((err, result) => {
                if(callback) callback(err, result);
                finish();
            });
        });
    })
}

DaijishouDebugClient.prototype.deleteFile = function(uriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        this.addTaskToExecutionQueue((err, finish) => {
            if(err) {
                callback(err, null);
                return
            }
            this.buildFileDeleteFileSubOperation(uriString).run((err, result) => {
                if(callback) callback(err, result);
                finish();
            });
        });
    })
}

DaijishouDebugClient.prototype.pushFile = function(localPath, RemoteUriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        this.addTaskToExecutionQueue((err, finish) => {
            if(err) {
                callback(err, null);
                return
            }
            this.buildFilePushFileSubOperation(localPath, RemoteUriString).run((err, result) => {
                if(callback) callback(err, result);
                finish();
            });
        });
    })
}


DaijishouDebugClient.prototype.pullFile = function(RemoteUriString, localPath, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
    })
}

DaijishouDebugClient.prototype.pushAndInstallExtension = function(path, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
        // this.log("123");
    })
}

module.exports = DaijishouDebugClient