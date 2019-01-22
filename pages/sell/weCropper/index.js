// pages/sell/weCropper/index.js



import WeCropper from '../../../we-cropper/we-cropper.js'
const app = getApp();
let util = require('../../../utils/util');
const device = wx.getSystemInfoSync()
// console.log(device);
const width = device.windowWidth
// console.log(width);
const height = device.windowHeight - 50
// console.log(height);
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cropperOpt: {
      id: 'cropper',
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (width - 300) / 2,
        y: (height - 300) / 2,
        width: 300,
        height: 300
      },
    },
    stop: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { cropperOpt } = this.data;
    new WeCropper(cropperOpt).on('ready', (ctx) => { }).on('beforeImageLoad', (ctx) => {
      wx.showToast({
        title: '上传中',
        icon: 'loading',
        duration: 20000
      })
    }).on('imageLoad', (ctx) => { wx.hideToast() })

    this.wecropper.pushOrign(options.src)
  },
  touchStart(e) {
    this.wecropper.touchStart(e)
  },
  touchMove(e) {
    this.wecropper.touchMove(e)
  },
  touchEnd(e) {
    this.wecropper.touchEnd(e)
  },
  getCropperImage() {
    let _this = this;
    if (this.data.stop) {
      this.setData({
        stop: false
      });
      this.wecropper.getCropperImage((src) => {
        if (src) {
          console.log(src, 'tupianlianjie');
          wx.setStorageSync("imgsrc", src);
          wx.setStorageSync("imgtype", 1);
          util.pageGo(null, 1, 1)
        } else {
          _this.setData({
            stop: true
          });
          util.ErrorTips(_this, '获取图片地址失败，请稍后重试')
          //console.log('获取图片地址失败，请稍后重试')
        }
      })
    }
  },
})