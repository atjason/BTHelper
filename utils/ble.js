
const ServiceId = "FFF0"
const CharacteristicId = "FFF1"

class BLE {

  constructor() {
    this.deviceId = undefined
    this.serviceId = undefined
    this.characteristicId = undefined
  }

  async openAdapter() {
    return await this.wxRequest('openBluetoothAdapter')
  }

  async closeAdapter() {
    return await this.wxRequest('closeBluetoothAdapter')
  }

  async startDevicesDiscovery(cb) {

    wx.onBluetoothDeviceFound(res => {
      for (let device of res.devices) {
        cb(device)
      }
    })

    wx.startBluetoothDevicesDiscovery({
      //services: [serverId],
      allowDuplicatesKey: false,
    })
  }

  async stopDevicesDiscovery() {
    return await this.wxRequest('stopBluetoothDevicesDiscovery')
  }

  async createBLEConnection(deviceId) {
    return await this.wxRequest('createBLEConnection', {
      deviceId,
      timeout: 5000, // 5s
    })
  }

  async closeBLEConnection(deviceId) {
    deviceId = deviceId || this.deviceId
    return await this.wxRequest('closeBLEConnection', { deviceId })
  }

  onBLEConnectionStateChange(cb) {
    wx.onBLEConnectionStateChange(res => {
      cb(res)
    })
  }

  async getBLEDeviceServices(deviceId) {
    return await this.wxRequest('getBLEDeviceServices', { deviceId })
  }

  async getBLEDeviceCharacteristics(deviceId, serviceId) {
    return await this.wxRequest('getBLEDeviceCharacteristics', { deviceId, serviceId })
  }

  async notifyBLECharacteristicValueChange(deviceId, serviceId, characteristicId) {
    return await this.wxRequest('notifyBLECharacteristicValueChange', { deviceId, serviceId, characteristicId, state: true })
  }

  onBLECharacteristicValueChange(cb) {
    wx.onBLECharacteristicValueChange(res => {
      cb(this.ab2str(res.value))
    })
  }

  async writeBLECharacteristicValue(str, deviceId, serviceId, characteristicId) {
    if (!str.length) return

    const buffer = new ArrayBuffer(str.length);
    let x = new Uint8Array(buffer);
    for (let i = 0; i < x.length; i++) {
      x[i] = str.charCodeAt(i)
    }

    return await this.wxRequest('writeBLECharacteristicValue', { deviceId, serviceId, characteristicId, value: buffer })
  }

  async easySendData(str) {
    const { deviceId, serviceId, characteristicId } = this
    if (!deviceId || !serviceId || !characteristicId) {
      const error = "Not connected yet."
      return { error }
    }

    return await this.writeBLECharacteristicValue(str, deviceId, serviceId, characteristicId)
  }

  async easyConnect(deviceId) {
    
    try {
      let res = {}

      res = await this.createBLEConnection(deviceId)
      if (res.error) throw res
      
      res = await this.getBLEDeviceServices(deviceId)
      if (res.error) throw res

      let serviceId
      for (let service of res.services) {
        console.log(service)
        if (service.uuid.split("-")[0].endsWith(ServiceId)) {
          serviceId = service.uuid
        }
      }
      if (!serviceId) {
        throw { error: "Service not found." }
      }

      res = await this.getBLEDeviceCharacteristics(deviceId, serviceId)
      if (res.error) throw res

      let characteristicId
      for (let characteristic of res.characteristics) {
        console.log(characteristic)
        if (characteristic.uuid.split("-")[0].endsWith(CharacteristicId)) {
          characteristicId = characteristic.uuid
        }
      }
      if (!characteristicId) {
        throw { error: "Characteristic not found." }
      }

      res = await this.notifyBLECharacteristicValueChange(deviceId, serviceId, characteristicId)
      if (res.error) throw res

      // await setBLEMTU(250) // TODO

      this.deviceId = deviceId
      this.serviceId = serviceId
      this.characteristicId = characteristicId

      return {}

    } catch(e) {
      await this.closeBLEConnection(deviceId)
      return e
    }
  }

  async wxRequest(key, param = {}) {
    try {
      return await wx[key](param)
    } catch(e) {
      const error = e.errCode + '_' + e.errMsg
      return { error }
    }
  }

  ab2str(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer))
  }

  ab2hex(buffer) {
    let hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }
}

module.exports = new BLE()
