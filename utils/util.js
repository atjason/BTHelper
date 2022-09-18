
class Util {

  showModal(title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false
    })
  }

  showToast(title) {
    wx.showToast({
      title,
      icon: "none",
    })
  }

}

module.exports = new Util()
