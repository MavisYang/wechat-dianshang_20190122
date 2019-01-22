// pages/sell/webView/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    url: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //console.log(options);
    let urls = 'https://wx.gemii.cc/gemii/poster/index.html?id=' + options.scene + '&urlType=pro&updateState=' + options.updateState;
    if (options.scene) {
      this.setData({
        url: urls
      })
    }
  },
})