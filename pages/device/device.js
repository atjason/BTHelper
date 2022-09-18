
const util = require('../../utils/util')
const ble = require('../../utils/ble.js')

let that
var sendData = ""
let sendHistory = [
  '{LD|15_20_166#}',
  '{STT|1663156832_28800#}',
  '{LDT|#}',
  '{VCC|#}',
  '{RMF|1#}',
  '{AT|AT+LED=0#}',
]

Page({

  data: {
    textInput: "",
    textRevData: "",
    scrollIntoView: "scroll-view-bottom"
  },

  onLoad: function (options) {
    that = this
    
    ble.onBLEConnectionStateChange(() => {
      util.showToast('设备断开连接')
    })
    
    ble.onBLECharacteristicValueChange(str => {
      const data = that.data.textRevData + "[" + that.dateFormat("hh:mm:ss,S", new Date()) + "]:" + str + "\r\n"
      that.setData({ textRevData: data })
      that.setData({ scrollIntoView: "scroll-view-bottom" }) //scroll to bottom
    })
  },

  onUnload: function () {
    ble.closeBLEConnection()
  },
  inputSendData(e) {
    sendData = e.detail.value
  },
  btClearTap(){
    this.setData({ textRevData: "" })
  },
  async btSendTap() {
    if (!sendData.length) return
    if (!sendHistory.includes(sendData)) {
      sendHistory = [sendData, ...sendHistory.slice(0, 5)]
    }
    if (!sendData.endsWith('\n')) sendData += '\n'    
    const res = await ble.easySendData(sendData.replace(/\n/g,"\r\n"), false)
    if (res.error) {
      const error = "Failed to send: " + res.error
      console.error(error)
      util.showToast(error)
    }
  },
  showSendHistory() {
    wx.showActionSheet({
      itemList: sendHistory,
      success (res) {
        sendData = sendHistory[res.tapIndex]
        that.setData({ textInput: sendData })
        that.btSendTap()
      },
    })
  },
  dateFormat(fmt, date) {
    var o = {
      "M+": date.getMonth() + 1,                 //月份   
      "d+": date.getDate(),                    //日   
      "h+": date.getHours(),                   //小时   
      "m+": date.getMinutes(),                 //分   
      "s+": date.getSeconds(),                 //秒   
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
      "S": date.getMilliseconds()             //毫秒   
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? ((o[k]) + "").padStart(3, "0") : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    return fmt;
  }
})
