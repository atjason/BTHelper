
const logEnable = true

let deviceList = []

let ecDeviceId = ""
let ecServerId = ''
let ecWriteCharacteristicId = ''
let ecReadCharacteristicId = ''

let ecServerIdOption1 = "0000FFF0-0000-1000-8000-00805F9B34FB"
let ecServerIdOption2 = "FFF0"
let ecWriteCharacteristicIdOption1 = "0000FFF2-0000-1000-8000-00805F9B34FB"
let ecWriteCharacteristicIdOption2 = "FFF2"
let ecReadCharacteristicIdOption1 = "0000FFF1-0000-1000-8000-00805F9B34FB"
let ecReadCharacteristicIdOption2 = "FFF1"

const log = (data) => {
  if (logEnable) {
    console.log(data)
  }
}
const wait = (i) => {
  return new Promise(function (resolve, reject) {
    setTimeout(() => {
      resolve()
    }, i);
  })
}
const openBluetoothAdapter = () => {
  return new Promise(function (resolve, reject) {
    wx.openBluetoothAdapter({
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: "" })
      },
      fail(res) {
        log(res)
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}
const closeBluetoothAdapter = () => {
  return new Promise(function (resolve, reject) {
    wx.closeBluetoothAdapter({
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}
const getBluetoothAdapterState = () => {
  return new Promise(function (resolve, reject) {
    wx.getBluetoothAdapterState({
      success(res) {
        if (res.available) {
          resolve({ ok: true, errCode: 0, errMsg: '' })
        } else {
          //蓝牙适配器不可用，打印失败信息
          log(res)
          resolve({ ok: false, errCode: 20000, errMsg: '蓝牙适配器关闭' })
        }
      },
      fail(res) {
        //打印失败信息
        log(res)
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

const startBluetoothDevicesDiscovery = (cb) => {
  deviceList = []
  wx.onBluetoothDeviceFound((res) => {
    let name = res.devices[0].name ? res.devices[0].name : res.devices[0].localName
    if (!name) { return }
    // log(res)
    for (const item of deviceList) {
      if (item.name === name) {
        item.rssi = res.devices[0].RSSI
        cb(name, item.rssi)
        return
      }
    }
    deviceList.push({ name, rssi: res.devices[0].RSSI, deviceId: res.devices[0].deviceId })
    cb(name, res.devices[0].RSSI)
  })
  //开始搜索
  wx.startBluetoothDevicesDiscovery({
    //services: [ecServerId],
    allowDuplicatesKey: true,
    success(res) {
    },
    fail(res) {
    }
  })
}

//结束搜索
const stopBluetoothDevicesDiscovery = () => {
  return new Promise(function (resolve, reject) {
    //停止扫描
    wx.stopBluetoothDevicesDiscovery({
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

//和设备建立连接
const createBLEConnection = (name) => {
  return new Promise(function (resolve, reject) {
    let isExist = false
    for (const item of deviceList) {
      if (item.name === name) {
        isExist = true
        ecDeviceId = item.deviceId
        break
      }
    }
    if (!isExist) {
      resolve({ ok: false, errCode: -1, errMsg: "Name error,Device does not exist" })
      return
    }
    //开始连接
    wx.createBLEConnection({
      deviceId: ecDeviceId,
      success(res) {
        log(res)
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        //连接失败
        log("connect fail")
        log(res)
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

//关闭当前连接
const closeBLEConnection = () => {
  return new Promise(function (resolve, reject) {
    wx.closeBLEConnection({
      deviceId: ecDeviceId,
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

const onBLEConnectionStateChange = (cb) => {
  wx.onBLEConnectionStateChange((res) => {
    if (!res.connected) cb()
  })
}

const getBLEDeviceServices = () => {
  return new Promise(function (resolve, reject) {
    wx.getBLEDeviceServices({
      deviceId: ecDeviceId,
      success(res) {
        log('device services:')
        log(res.services)
        for (let i = 0; i < res.services.length; i++) {
          let uuid = ''
          log(res.services[i].uuid)
          uuid = res.services[i].uuid.toUpperCase()
          if (uuid === ecServerIdOption1) {
            ecServerId = ecServerIdOption1
            return resolve({ ok: true, errCode: 0, errMsg: '' })
          }
          if (uuid === ecServerIdOption2) {
            ecServerId = ecServerIdOption2
            return resolve({ ok: true, errCode: 0, errMsg: '' })
          }
        }
        resolve({ ok: false, errCode: 20000, errMsg: '服务未找到' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

//连接特性
const getBLEDeviceCharacteristics = () => {
  return new Promise(function (resolve, reject) {
    wx.getBLEDeviceCharacteristics({
      deviceId: ecDeviceId,
      serviceId: ecServerId,
      success(res) {
        log('device getBLEDeviceCharacteristics:')
        log(res.characteristics)
        if (res.characteristics.length < 2) {
          resolve({ ok: false, errCode: 20000, errMsg: '特征值出错' })
          return
        }
        let uuid1 = ''
        let uuid2 = ''
        uuid1 = res.characteristics[0].uuid.toUpperCase()
        uuid2 = res.characteristics[1].uuid.toUpperCase()
        if ((uuid1 === ecWriteCharacteristicIdOption1)
          && (uuid2 === ecReadCharacteristicIdOption1)) {
          ecWriteCharacteristicId = ecWriteCharacteristicIdOption1
          ecReadCharacteristicId = ecReadCharacteristicIdOption1
          resolve({ ok: true, errCode: 0, errMsg: '' })
        }
        else if ((uuid1 === ecReadCharacteristicIdOption1)
          && (uuid2 === ecWriteCharacteristicIdOption1)) {
          ecWriteCharacteristicId = ecWriteCharacteristicIdOption1
          ecReadCharacteristicId = ecReadCharacteristicIdOption1
          resolve({ ok: true, errCode: 0, errMsg: '' })
        }
        else if ((uuid1 === ecWriteCharacteristicIdOption2)
          && (uuid2 === ecReadCharacteristicIdOption2)) {
          ecWriteCharacteristicId = ecWriteCharacteristicIdOption2
          ecReadCharacteristicId = ecReadCharacteristicIdOption2
          resolve({ ok: true, errCode: 0, errMsg: '' })
        }
        else if ((uuid1 === ecReadCharacteristicIdOption2)
          && (uuid2 === ecWriteCharacteristicIdOption2)) {
          ecWriteCharacteristicId = ecWriteCharacteristicIdOption2
          ecReadCharacteristicId = ecReadCharacteristicIdOption2
          resolve({ ok: true, errCode: 0, errMsg: '' })
        }
        else {
          resolve({ ok: false, errCode: 20000, errMsg: '特征值出错' })
        }
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

//订阅通知 接收key
const notifyBLECharacteristicValueChange = () => {
  return new Promise(function (resolve, reject) {
    //开始订阅
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: ecDeviceId,
      serviceId: ecServerId,
      characteristicId: ecReadCharacteristicId,
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

const setBLEMTU = (mtu) => {
  return new Promise(function (resolve, reject) {
    //开始订阅
    wx.setBLEMTU({
      deviceId: ecDeviceId,
      mtu,
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

const easyConnect = async (name, cb) => {
  let res = {}
  await closeBluetoothAdapter()
  await openBluetoothAdapter()
  res = await createBLEConnection(name)
  if (!res.ok) {
    res = { ok: false, errMsg: '蓝牙连接失败|' + res.errCode + '|' + res.errMsg, errCode: 10001 }
    cb(res)
    return res
  }
  res = await getBLEDeviceServices()
  if (!res.ok) {
    closeBLEConnection()
    res = { ok: false, errMsg: '获取服务失败|' + res.errCode + '|' + res.errMsg, errCode: 10002 }
    cb(res)
    return res
  }
  res = await getBLEDeviceCharacteristics()
  if (!res.ok) {
    closeBLEConnection()
    res = { ok: false, errMsg: '获取特性失败|' + res.errCode + '|' + res.errMsg, errCode: 10003 }
    cb(res)
    return res
  }
  res = await notifyBLECharacteristicValueChange()
  if (!res.ok) {
    closeBLEConnection()
    res = { ok: false, errMsg: '订阅失败|' + res.errCode + '|' + res.errMsg, errCode: 10004 }
    cb(res)
    return res
  }
  await setBLEMTU(250)
  res = { ok: true, errMsg: '', errCode: 0 }
  cb(res)
  return res
}

const onBLECharacteristicValueChange = (cb) => {
  wx.onBLECharacteristicValueChange((res) => {
    let x = new Uint8Array(res.value);
    // log(x)
    let strHex = ""
    let str = ""
    for (let i = 0; i < x.length; i++) {
      strHex = strHex + x[i].toString(16).padStart(2, "0")
      str = str + String.fromCharCode(x[i])
    }
    // log(strHex)
    // log(str)
    cb(str, strHex)
  })
}

const writeBLECharacteristicValue = (data) => {
  return new Promise(function (resolve, reject) {
    wx.writeBLECharacteristicValue({
      deviceId: ecDeviceId,
      serviceId: ecServerId,
      characteristicId: ecWriteCharacteristicId,
      value: data,
      success(res) {
        resolve({ ok: true, errCode: 0, errMsg: '' })
      },
      fail(res) {
        resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
      }
    })
  })
}

const easySendData = async (str, isHex) => {
  if (str.length === 0) return
  if (isHex) {
    const buffer = new ArrayBuffer(str.length / 2);
    let x = new Uint8Array(buffer);
    for (let i = 0; i < x.length; i++) {
      x[i] = parseInt(str.substr(2 * i, 2), 16)
    }
    return await writeBLECharacteristicValue(buffer)
  } else {
    const buffer = new ArrayBuffer(str.length);
    let x = new Uint8Array(buffer);
    for (let i = 0; i < x.length; i++) {
      x[i] = str.charCodeAt(i)
    }
    return await writeBLECharacteristicValue(buffer)
  }
}

module.exports = {
  openBluetoothAdapter,
  closeBluetoothAdapter,
  getBluetoothAdapterState,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  easyConnect,
  closeBLEConnection,
  onBLEConnectionStateChange,
  onBLECharacteristicValueChange,
  easySendData,
}