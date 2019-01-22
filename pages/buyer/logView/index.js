// pages/buyer/logView/index.js
let API = require('../../../utils/api')
let AuthProvider = require('../../../utils/AuthProvider')
let wxRequest = require('../../../utils/wxRequest')
let util = require('../../../utils/util')
const app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgUrl: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        AuthProvider.getAccessToken().then(token => {
            "use strict";
            return wxRequest.fetch(API.getOrderImg + options.scene, {type: 'bearer', value: token}, null, "GET");
        }).then(res => {
            "use strict";
            if (res.data.resultCode === '100') {
                this.setData({
                    imgUrl: res.data.resultContent.imagePath
                })
            }
        }).catch(req => {
            "use strict";
            //console.log('Error' + req)
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    }
})