'use strict';
const net = require('net');

function DaijishouDebugClient(adb) {
    this._tcpClient = new net.Socket();
    this._adb = adb;
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
        run: (callback)=> {
            cb = callback
            this._runningOperation = operation;
            tcpClient.write(new Uint8Array([headerByteCode]));
        },
        onData: (data) => {
            this._runningOperation = null;
            cb();
        },
        onError: (err) => {
            this._runningOperation = null;
            cb(err);
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

DaijishouDebugClient.prototype.prettyLog = function(message) {
    console.log(`[DaijishouDebugClient] ${message}`);
}

DaijishouDebugClient.prototype.closeADB = function(callback) {
    const run = async () => {
        this.prettyLog('Closing up ADB...');
        const adb = this._adb
        this.prettyLog('Removing forwards.');
        await adb.removePortForward(this.PORT)
        this.prettyLog('Forwards remain:');
        this.prettyLog(await adb.getForwardList());
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
        this.prettyLog('Setting up ADB...');
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

DaijishouDebugClient.prototype.tcpOnData = function(data) {
    this.prettyLog('Received: ' + data);
    this._onConnectCallacks.forEach((it) => {
        it();
    });
    this._onConnectCallacks = [];
    if(this._lifecycle == this.IS_CONNECTING_LIFECYCLE) {
        this._lifecycle = this.IS_CONNECTED_LIFECYCLE;
        this.addTaskToExecutionQueue(null);
    }
    else {
        const runningOperation = this._runningOperation
        if(runningOperation) {
            runningOperation.onData(data);
        }
    }
    // this.disconnectTCP();
}

DaijishouDebugClient.prototype.tcpOnClose = function() {
    this._onConnectCallacks.forEach((it) => {
        it(true);
    });
    this._onConnectCallacks = [];
    this.prettyLog('Connection closed.');
    if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) this._lifecycle = this.IS_DISCONNECTED_LIFECYCLE;
}

DaijishouDebugClient.prototype.tcpOnError = function(err) {
    this.prettyLog(err);
    const runningOperation = this._runningOperation
    if(runningOperation) {
        runningOperation.onError(data);
    }
}


DaijishouDebugClient.prototype.connectTCP = function() {
    const run = async () => {
        if(this._lifecycle != this.IS_DISCONNECTED_LIFECYCLE) return
        this._lifecycle = this.IS_CONNECTING_LIFECYCLE
        this.prettyLog('Establishing TCP connection...');
        const tcpClient = this._tcpClient;
        tcpClient.connect(this.PORT, this.HOSTNAME, () => {
            tcpClient.write(new Uint8Array([0]));
        });
        tcpClient.on('data', this.tcpOnData.bind(this));
        tcpClient.on('error', this.tcpOnError.bind(this));
        tcpClient.on('close', this.tcpOnClose.bind(this));
    }
    try {
        run();
    }
    catch (err) {
        this.prettyLog(err);
    }
}

DaijishouDebugClient.prototype.disconnectTCP = function() {
    const run = async () => {
        this.prettyLog('Disconnecting TCP connection...');
        const tcpClient = this._tcpClient;
        tcpClient.destroy();
    }
    try {
        run();
    }
    catch (err) {
        this.prettyLog(err);
    }
}

DaijishouDebugClient.prototype.connect = function(callback) {
    const run = async () => {
        if(this._lifecycle == this.IS_CONNECTING_LIFECYCLE) {
            this._onConnectCallacks.push(callback);
        }
        else if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) {
            callback(null);
        }
        else if(this._lifecycle == this.IS_DISCONNECTED_LIFECYCLE) this.startADB((err) => {
            if(err) {
                if(callback) callback(err);
            }
            else {
                this._onConnectCallacks.push(callback);
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

DaijishouDebugClient.prototype.ensureConnection = function(callback) {
    if(this._lifecycle == this.IS_CONNECTED_LIFECYCLE) callback(null);
    else this.connect(callback)
}

// Task
DaijishouDebugClient.prototype.addTaskToExecutionQueue = function(task) {
    if(task!=null) this._taskQueue.push(task);
    if(this._lifecycle!=this.IS_CONNECTED_LIFECYCLE) return
    // this.prettyLog("addTaskToExecutionQueue exec");
    const executeNextTask = () => { 
        if(this._taskQueue.length>0) {
            this._executingTask = this._taskQueue.shift()
            this._executingTask(executeNextTask);
        }
        else {
            this._executingTask == null
        }
    }

    if(this._executingTask == null && this._taskQueue.length>0) {
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
            // this.prettyLog("addTaskToExecutionQueue");
            this.buildHeartbeatOperation().run((err) => {
                // this.prettyLog("addTaskToExecutionQueue");
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
        callback();
        this.prettyLog("123");
    })
}

DaijishouDebugClient.prototype.pushAndInstallExtension = function(path, callback) {
    this.ensureConnection((err) => {
        if(err) {
            callback(err);
            return
        }
        callback();
        this.prettyLog("123");
    })
}

module.exports = DaijishouDebugClient