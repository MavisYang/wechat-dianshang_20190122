// pages/sell/home/index.js
const app = getApp();
let util = require('../../../utils/util');
let SELL = require('../../../utils/sellFetch');
let AuthProvider = require('../../../utils/AuthProvider');
Page({
    /**
     * 页面的初始数据
     */
    data: {
        hasUserInfo: false,//用户授权状态
        userInfo: null,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),//判断是否支持button微信授权
        ruleState: false,//规则显示状态
        popErrorMsg: null,
        useStatus: false,
        firstOnce: true
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // 获取全局数据，用户头像。。。
        wx.setStorageSync("userType", "sell");//默认卖家
        if (wx.getStorageSync('phoneNum')) {
            AuthProvider.onLogin("sell", wx.getStorageSync('phoneNum'), res => {
                console.log("卖家鉴权：" + res);
            })
        } else {
            if (wx.getStorageSync('unionid')) {
                util.pageGo('/pages/sell/apply/index', 1)
            }
        }
    },
    onShow: function () {
        app.getGlobalDatas(this.data.canIUse, res => {
            "use strict";
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            });
        });
        if (wx.getStorageSync('phoneNum') && this.data.firstOnce) {
            console.log('------在页面显示的时候判断手机号码------');
            SELL.queryShopOwnerWhiteList(wx.getStorageSync('phoneNum'), res => {
                "use strict";
                // console.log('***返回参数 start***');
                // console.log(res);
                // console.log('***返回参数 end***');
                if (res.data.resultCode === '100') {
                    this.setData({
                        firstOnce: false
                    })
                    if (res.data.resultContent) {
                        if (res.data.resultContent.status == 0) {
                            util.ErrorTips(this, '您已申请试用，审核中');
                            this.setData({
                                useStatus: false
                            })
                        } else if (res.data.resultContent.status == 1) {
                            getToken(res => {
                                // console.log(res)
                            });
                            this.setData({
                                useStatus: true
                            })
                        }
                    }
                }
            })
        }
    },
    getUserInfo: function (e) {
        app.getUserInfo(e, 'sell', res => {
            "use strict";
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            });
        })
    },
    showRule: function () {
        "use strict";
        this.setData({
            ruleState: true
        })
    },
    hideRule: function () {
        "use strict";
        this.setData({
            ruleState: false
        })
    },
    pageGoSecKill: function (e) {
        "use strict";
        if (wx.getStorageSync('phoneNum')) {
            if (this.data.useStatus) {
                util.pageGo('/pages/sell/secKill/index?type=' + e.currentTarget.dataset.type, 1)
            } else {
                util.ErrorTips(this, '请耐心等待')
            }
        } else {
            util.pageGo('/pages/sell/apply/index', 1)
        }
    },
    pageGoCash: function () {
        "use strict";
        if (this.data.useStatus) {
            util.pageGo('/pages/sell/withdraw/index', 1)
        } else {
            util.ErrorTips(this, '请耐心等待')
        }
    }
})

function getToken(callback) {
    AuthProvider.onLogin('sell', null, res => {
        callback(res)
    })
}