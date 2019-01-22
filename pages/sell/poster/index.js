// pages/sell/poster/index.js

const app = getApp();
let util = require('../../../utils/util');
let SELL = require('../../../utils/sellFetch');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgUrl: null,
        scene: null,
        updateState: null,
        dataParams: '',
        stop: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        //console.log(options);
        this.setData({
            updateState: options.updateState || null,
            imgUrl: options.dataUrl,
            scene: options.scene
        });
        SELL.getGoodDetail(options.scene, res => {
            "use strict";
            //console.log(res)
            if (res.data.resultCode === '100') {
                this.setData({
                    dataParams: res.data.resultContent
                })
            }
        })
    },
    downloadPoster: function () {
        "use strict";
        if (this.data.stop) {
            this.setData({
                stop: false
            });
            //console.log(this.data.imgUrl);
            let _this = this;
            let imgUrl = this.data.imgUrl;
            wx.downloadFile({
                url: imgUrl,
                success: res => {
                    //console.log(res);
                    let tempFilePath = res.tempFilePath;
                    wx.getSetting({
                        success: res => {
                            if (!res.authSetting['scope.writePhotosAlbum']) {
                                wx.authorize({
                                    scope: 'scope.writePhotosAlbum',
                                    success() {
                                        _this.saveImageToPhotosAlbum(tempFilePath)
                                    },
                                    fail() {
                                        //console.log('fail----');
                                        wx.showModal({ // 向用户提示升级至最新版微信。
                                            title: '授权失败',
                                            confirmColor: '#F45C43',
                                            content: '为成功保存图片，请重新授权。',
                                            mask: true,
                                            success: function (res) {
                                                if (res.confirm) {
                                                    wx.openSetting({
                                                        success() {
                                                            if (res.authSetting["scope.writePhotosAlbum"]) {
                                                                _this.saveImageToPhotosAlbum(tempFilePath)
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                            } else {
                                _this.saveImageToPhotosAlbum(tempFilePath)
                            }
                        },
                        fail: req => {
                            //console.log(req)
                        }
                    })
                }
            })
        }
    },
    saveImageToPhotosAlbum: function (tempFilePath) {
        let self = this
        wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: function (data) {
                //console.log(data.errMsg)
                if (data.errMsg == 'saveImageToPhotosAlbum:ok') {
                    self.setData({
                        showMask: false,
                        stop: true
                    })
                    util.successShowText('保存图片成功')
                }
            },
            fail(err) {
                //console.log('failsaveImageToPhotosAlbum----')
                //console.log(err)
            },
            complete: function () {
                self.setData({
                    stop: true
                })
            }
        })
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        console.log(this.data.dataParams);
        if(this.data.dataParams.ylId ==="$bargain$"){
            return util.openShare('【限时底价￥' + this.data.dataParams.showPrice + '】 ' + this.data.dataParams.name, '/pages/buyer/bargain/bargain?scene=' + this.data.scene + '&orgin=gemii', this.data.dataParams.coverPhoto, rex => {
                "use strict";
                //console.log(rex)
            })
        }else {
            return util.openShare('【秒杀价￥' + this.data.dataParams.showPrice + '】 ' + this.data.dataParams.name, '/pages/buyer/secKill/index?scene=' + this.data.scene + '&orgin=gemii', this.data.dataParams.coverPhoto, rex => {
                "use strict";
                //console.log(rex)
            })
        }

    },
    formSubmit: function (e) {
        util.formSubmit(e)
    }
})
