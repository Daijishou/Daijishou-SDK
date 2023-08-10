'use strict';
const net = require('net');

function DaijishouDebugClient(adb, verbose=false) {
    this._tcpClient = new net.Socket();
    this._adb = adb;
    this._verbose = verbose;
    this._lifecycle = this.IS_DISCONNECTED_LIFECYCLE;
    this._onConnectCallacks = [];
    this._taskQueue = [];
    this._executingTask = null;
    this._runningOperation = null;
}

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
            else cb(Error(`Hearbeat byte code not matched. Code: ${resposedByte[0]}`));
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.buildConsoleOperation = function(command) {
    const headerByteCode = 0x02;
    const tcpClient = this._tcpClient
    // console.log(this)
    // console.log(tcpClient)
    var cb = null
    var headerByteCodeRead = null
    var statusCode = null
    var resultLength = null
    var resultBytes = null
    var result = null
    const operation = {
        headerByteCode: headerByteCode,
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            const commandBytes = Buffer.from(command);;
            const commandLengthBytes = Buffer.alloc(4);
            commandLengthBytes.writeInt32BE(commandBytes.length)
            tcpClient.write(Buffer.concat([
                Buffer.from([headerByteCode]),
                commandLengthBytes,
                commandBytes
            ]));
        },
        onReadable: () => {
            if(headerByteCodeRead == null) headerByteCodeRead = tcpClient.read(1)[0];
            if(statusCode == null) {
                const statusCodeByte = tcpClient.read(4);
                if(statusCodeByte != null) {
                    statusCode = statusCodeByte.readInt32BE()
                }
            }
            if(resultLength == null) {
                const resultLengthBytes = tcpClient.read(4);
                if(resultLengthBytes != null) {
                    resultLength = resultLengthBytes.readInt32BE()
                }
            }
            if(resultLength == null) return
            resultBytes = tcpClient.read(resultLength);
            if(resultBytes==null||resultBytes.length != resultLength) return

            this._runningOperation = null;
            cb(null, {
                statusCode: statusCode,
                message: resultBytes.toString()
            });
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err, null);
        }
    }
    return operation
}

DaijishouDebugClient.prototype.operations = {
    HeartbeatOperation: {

    },
    ExceptionOperation: {
        headerByteCode: 0x01,

    },
    ConsoleOperation: {
        headerByteCode: 0x02,

    },
    FileOperation: {
        headerByteCode: 0x03,

    },
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
    if(this._lifecycle == this.IS_CONNECTING_LIFECYCLE) {
        this._lifecycle = this.IS_CONNECTED_LIFECYCLE;
        this._tcpClient.read(1)
        this.addTaskToExecutionQueue(null);
    }
    else {
        const runningOperation = this._runningOperation
        if(runningOperation) {
            runningOperation.onReadable();
        }
        else {
            const data = this._tcpClient.read()
            this.log(`Ignore data:`)
            if(this._verbose) console.log(data)
        }
    }
    // this.disconnectTCP();
}

DaijishouDebugClient.prototype.tcpOnClose = function() {
    this._onConnectCallacks.forEach((it) => {
        it(true);
    });
    this._onConnectCallacks = [];
    this.log('Connection closed.');
    if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) this._lifecycle = this.IS_DISCONNECTED_LIFECYCLE;
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
        const tcpClient = this._tcpClient;
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
        if(this._taskQueue.length>0) {
            this._executingTask = this._taskQueue.shift()
            this._executingTask(executeNextTask);
        }
        else {
            this._executingTask = null
        }
    }

    if(this._executingTask == null && this._taskQueue.length>0) {
        // this.log("addTaskToExecutionQueue exec start");
        this._executingTask = this._taskQueue.shift()
        this._executingTask(executeNextTask);
    }
}


// Functions

DaijishouDebugClient.prototype.heartbeat = function(callback) {
    this.ensureConnection((err) => {
        if(err) {
            if(callback) callback(err);
            return
        }
        this.addTaskToExecutionQueue((finish) => {
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
        // this.log('a hb task');
        this.addTaskToExecutionQueue((finish) => {
            // this.log('hb task');
            this.buildConsoleOperation(command).run((err, result) => {
                if(callback) callback(err, result);
                finish();
            });
        });
    })
}

DaijishouDebugClient.prototype.CACHE_FILES_BASE_URI = "daijishou-files://cache/"
DaijishouDebugClient.prototype.DATA_FILES_BASE_URI = "daijishou-files://files/"

DaijishouDebugClient.prototype.listFiles = function(uriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
    })
}

DaijishouDebugClient.prototype.deleteFiles = function(uriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
    })
}

DaijishouDebugClient.prototype.pushFiles = function(uriString, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
    })
}


DaijishouDebugClient.prototype.pullFiles = function(files, callback) {
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