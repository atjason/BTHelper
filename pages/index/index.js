// index.js
// 获取应用实例
const app = getApp()
const util = require('../../utils/util')
const ble = require('../../utils/ble.js')
const ecBLE = require('../../utils/ecBLE.js')

let that
let autoJumped = false

Page({
  data: {
    deviceListData: [],
    deviceListDataShow: [],
  },
  async onLoad() {
    that = this
    setInterval(() => {
      const filterName = "tafit"
      let { deviceListData } = that.data
      deviceListData.sort((a, b) => {
        if (a.name.toLowerCase().includes(filterName)) return -1
        if (b.name.toLowerCase().includes(filterName)) return 1
        return b.rssi - a.rssi
      })
      that.setData({ deviceListDataShow: deviceListData })

      if (!autoJumped && deviceListData.length) {
        const { deviceId, name } = deviceListData[0]
        if (name.toLowerCase().includes(filterName)) {
          autoJumped = true
          that.connnectBT(deviceId)
        }
      }
    }, 600)
  },
  async onShow() {
    
    this.setData({ deviceListData: [] })
    this.setData({ deviceListDataShow: [] })
    setTimeout(() => {
      that.startDiscovery()
    }, 100)
  },
  onPullDownRefresh: function () {
    this.setData({ deviceListData: [] })
    this.setData({ deviceListDataShow: [] })
    
    setTimeout(() => {
      wx.stopPullDownRefresh()
      that.startDiscovery()
    }, 500)
  },
  async listViewTap(event) {
    this.connnectBT(event.currentTarget.dataset.deviceId)
  },
  async connnectBT(deviceId) {
    that.showLoading()

    const res = await ble.easyConnect(deviceId)
    that.hideLoading()
    if (!res.error) {
      that.gotoDevicePage()
    } else {
      console.error(res.error)
      that.showToast(res.error)
    }
  },
  showLoading() {
    wx.showToast({
      title: '设备连接中',
      icon: 'loading',
      duration: 3600000,
      mask: true
    })
  },
  hideLoading() {
    wx.hideLoading()
  },
  gotoDevicePage() {
    ecBLE.stopBluetoothDevicesDiscovery()
    wx.navigateTo({
      url: '../device/device'
    })
  },
  async startDiscovery() {
    
    await ble.closeAdapter()

    let result = await ble.openAdapter()
    if (!result.error) {
      ble.startDevicesDiscovery(device => {
        let { deviceId, name, localName, RSSI } = device
        name = name || localName
        if (!name || !name.length || name.includes('Unknown')) return

        for (const item of that.data.deviceListData) {
          if (item.name === name) return
        }
        that.data.deviceListData.push({ deviceId, name, rssi: RSSI })
      })

    } else {
      util.showModal("提示", "打开蓝牙适配器失败: " + result.error)
    }
  },
})
