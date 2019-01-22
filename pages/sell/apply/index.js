// pages/sell/apply/index.js
let util = require('../../../utils/util');
let SELL = require('../../../utils/sellFetch');
let AuthProvider = require('../../../utils/AuthProvider');
Page({
    /**
     * 页面的初始数据
     */
    data: {
        name: null,
        phone: null,
        store: null,
        popErrorMsg: null,//错误提示信息
        stop: true,//阻止机制
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },
    formSubmit: function (e) {
        //console.log(111);
        util.formSubmits(e)
    },
    //输入姓名
    changeName: function (e) {
        "use strict";
        this.setData({
            name: e.detail.value
        })
    },
    //  输入手机号码
    changePhone: function (e) {
        this.setData({
            phone: e.detail.value
        });
    },
    // 输入店铺名称
    changeStore: function (e) {
        "use strict";
        this.setData({
            store: e.detail.value
        })
    },
    //提交申请
    submitApply: function () {
        "use strict";
        let { name, phone, store, stop } = this.data;
        if (!name || !phone || !store) {
            util.ErrorTips(this, '请填写完整数据！')
        } else if (!util.verifyPhone(phone)) {
            util.ErrorTips(this, '请确认手机号码!')
        } else {
            AuthProvider.onLogin("sell", phone, res => {
                //console.log(res)
                if (res.resultCode === '100') {
                    util.pageGo(1, null, 1);
                }
                console.log(res, '卖家登录操作')
                if (res.code === 404) {
                    let data = {
                        phone: phone,
                        shopName: store,
                        username: name,
                        unionId: wx.getStorageSync('unionid')
                    }
                    SELL.apply(data, res => {
                        console.log(res, '申请入驻')
                        if (res.data.resultCode === '100') {
                            util.ErrorTips(this, '申请成功，待审核')
                            util.pageGo(1, null, 1);
                        }
                    })
                }
            })
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
    },

})