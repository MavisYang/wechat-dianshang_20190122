// pages/buyer/success/index.js
const app = getApp();
let util = require('../../../utils/util');
let API = require('../../../utils/api')
let wxRequest = require('../../../utils/wxRequest')
let AuthProvider = require('../../../utils/AuthProvider')
Page({

    /**
     * 页面的初始数据
     */
    data: {
        address: '',
        code: '',
        coverPhoto: '',
        goodName: '',
        weChatNo: '',
        styleBg:null
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let url = API.getGoodInfo
        // let goodId = 'ee6897d2-d4f9-4c41-82d9-3557fc743966'
        let goodId = options.scene
        let self = this
        wxRequest.fetch(API.getGoodInfo + '?goodId=' + goodId, null, null, "GET").then(res => {
            self.setData({
                styleBg:res.data.resultContent.ylId,
                address: res.data.resultContent.productWarehouse.bondedWarehouseName,
                code: res.data.resultContent.productDescription.find(item => item.type == 6).code,
                weChatNo: res.data.resultContent.productDescription.find(item => item.type == 7),
                coverPhoto: res.data.resultContent.coverPhoto,
                goodName: res.data.resultContent.name
            })
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

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

})