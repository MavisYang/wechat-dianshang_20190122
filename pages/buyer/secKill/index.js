// pages/buyer/buyer.js
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
        userInfo: null,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),//判断是否支持button微信授权
        goodData: {},
        status: 1,
        productDescription: {},
        timeLeft: '00:00:00',
        timeLeftBuy: '00:00:00',
        secKillFlag: false,
        repertory: true,
        expiredFlag: false,
        effectiveDate: 0,
        expiredDate: 0,
        hasUserInfo: false,
        goodId: '',
        paymentFlag: false,
        stop: true,//阻止机制
        popErrorMsg: '',
        phoneNum: '',
        phoneCode: '',
        phoneText: '获取验证码',
        phoneCodeState: false,
        phoneNumState: false,
        phoneBtnState: false,
        phoneMS: false,
        weChatNo: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setStorageSync("userType", "buy");
        wx.getSetting({
            success(res) {
                "use strict";
                if (res.authSetting["scope.userInfo"]) {
                    console.log("已授权成功");
                    let unionid = wx.getStorageSync('unionid');
                    if (unionid) {
                        AuthProvider.onLogin('buy', null, res => {
                            console.log('买家鉴权')
                        })
                    } else {
                        util.ErrorTips(this, "鉴权未成功，尝试删除，重新进入小程序")
                    }
                    // AuthProvider.onLogin();
                }
            }
        });
        console.log(options, options)
        if (options.orgin) {
            wx.reportAnalytics('data_from', {
                orgin: options.orgin,
            });
        }
        let unionid = wx.getStorageSync('unionid');
        if (unionid) {
            AuthProvider.onLogin('buy', null, res => {
                console.log('买家鉴权')
            })
        }
        app.getGlobalDatas(this.data.canIUse, res => {
            "use strict";
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            });
        })
        this.setData({
            goodId: options.scene
        }, () => {
            this.requestGoodInfo(options.scene)
        })
    },
    //输入手机号码
    changePhone: function (e) {
        if (util.verifyPhone(e.detail.value)) {
            this.setData({
                phoneCodeState: true,
                phoneNumState: true,
                phoneNum: e.detail.value
            });
            if (this.data.phoneCode.length === 6) {
                this.setData({
                    phoneBtnState: true,
                })
            } else {
                this.setData({
                    phoneBtnState: false,
                })
            }
        } else {
            this.setData({
                phoneCodeState: false,
                phoneNumState: false,
                phoneBtnState: false,
                phoneNum: e.detail.value
            })
        }

    },
    //输入验证码：
    changeCode: function (e) {
        if (e.detail.value.length === 6 && this.data.phoneNumState) {
            this.setData({
                phoneBtnState: true,
                phoneCode: e.detail.value
            });
        } else {
            this.setData({
                phoneBtnState: false,
                phoneCode: e.detail.value
            })
        }
    },
    //获取phonecode
    getPhoneCode: function () {
        if (this.data.phoneCodeState) {
            this.setData({
                phoneCodeState: false
            });
            util.count_down(this, 60000);
            wxRequest.fetch(API.getPhoneCode + this.data.phoneNum, null, null, "GET").then(res => {
                "use strict"
                if (res.data.resultCode === '100') {
                    // util.ErrorTips(this,'发送成功')
                } else {
                    util.ErrorTips(this, '发送失败')
                }
            }).catch(req => {
                "use strict";
                this.setData({
                    phoneCodeState: true,
                });
                util.ErrorTips(this, '发送失败')
            })
        }
    },
    bindPhone: function () {
        let dataParams = {
            code: this.data.phoneCode,
            phone: this.data.phoneNum,
            templateCode: 'SHOP_OWNER_VCODE_MSG'
        }
        wxRequest.fetch(API.codeYAN, null, dataParams, 'POST').then(res => {
            if (res.data.resultCode === '100') {
                this.closePhoneModule();
                wx.setStorageSync('phoneNum', this.data.phoneNum)
            } else {
                util.ErrorTips(this, '验证码输入有误')
            }
        })
    },
    // 获取 用户信息
    getUserInfo: function (e) {
        app.getUserInfo(e, 'buy', res => {
            console.log(res)
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            })
        })
    },
    // 获取商品详情
    requestGoodInfo: function () {
        let url = API.getGoodInfo
        let { goodId } = this.data
        // let goodId = 'ee6897d2-d4f9-4c41-82d9-3557fc743966'
        let self = this
        wxRequest.fetch(API.getGoodInfo + '?goodId=' + goodId, null, null, "GET").then(res => {
            console.log('获取商品详情', res);
            self.setData({
                goodData: res.data.resultContent,
                productDescription: res.data.resultContent.productDescription.find(item => item.type == 2),
                weChatNo: res.data.resultContent.productDescription.find(item => item.type == 7),
                percent: 12 + 88 * (res.data.resultContent.totalSaledQuantity / res.data.resultContent.totalQuantity) + '%',
                effectiveDate: res.data.resultContent.effectiveDate,
                expiredDate: res.data.resultContent.expiredDate,
                status: res.data.resultContent.status,
                repertory: !(res.data.resultContent.totalSaledQuantity == res.data.resultContent.totalQuantity)
            }, () => {
                // console.log(self.data.productDescription,'productDescription')
                // console.log(self.data.weChatNo,'weChatNo')
                self.countdown()
                self.countdownBuy()
                wx.setStorageSync('productData', res.data.resultContent)
            })
            this.requestSkuInfo(res.data.resultContent.id)
        })
    },
    //获取商品sku信息
    requestSkuInfo: function (goodId) {
        let self = this
        // let goodId = 'ee6897d2-d4f9-4c41-82d9-3557fc743966'
        let url = API.getSkuInfo + goodId + '/sku'
        wxRequest.fetch(url, null, null, "GET").then(res => {
            console.log('获取商品sku信息', res)
            self.setData({
                skuId: res.data.resultContent[0].id
            }, () => {
                wx.setStorageSync('skuId', res.data.resultContent[0].id)
            })
        })
    },
    // 提交商品购买
    subMain() {
        "use strict";
        let self = this
        if (this.data.paymentFlag) return
        this.setData({ paymentFlag: true })
        let params = {
            "proPayment": {
                "appid": API.APP_ID,
                "body": "小程序 商品秒杀",
                "openId": wx.getStorageSync('openid')
            },
            "quantity": 1,
            "skuId": this.data.skuId,
            "receiveAddress": null,
            "receiveName": null,
            "receivePhone": null,
            "takeWay": 1//1:到店取货 2快递
        }
        AuthProvider.getAccessToken().then(token => {
            return wxRequest.fetch(API.submitOrder, { type: 'bearer', value: token }, params, "POST")
        }).then(res => {
            console.log('提交商品购买')
            if (res.data.resultCode == '100') {
                if (res.data.resultContent) {
                    // 在线支付
                    wx.requestPayment({
                        'timeStamp': res.data.resultContent.timeStamp,
                        'nonceStr': res.data.resultContent.nonceStr,
                        'package': res.data.resultContent.package,
                        'signType': res.data.resultContent.signType,
                        'paySign': res.data.resultContent.sign,
                        'success': function (res) {
                            // 支付成功
                            util.pageGo('/pages/buyer/success/index?scene=' + self.data.goodId, 2)
                        },
                        'fail': function (res) {
                            util.ErrorTips(self, '秒杀失败')
                        },
                        'complete': function () {
                            self.setData({ paymentFlag: false })
                        }
                    })
                    // self.submitPayment(res.data.resultContent.paymentInfo.id)
                } else {
                    // 到店支付
                    self.setData({ paymentFlag: false })
                    util.pageGo('/pages/buyer/success/index?scene=' + self.data.goodId, 2)
                }
            } else {
                util.ErrorTips(self, '秒杀失败')
                self.setData({ paymentFlag: false })
            }
        })
    },
    submitPurchase() {
        if (this.data.hasUserInfo) {
            // 马上抢（立即支付）；跳转到另外的页面支付
            if (!this.data.weChatNo) {
                this.subMain()
            } else {
                util.pageGo('/pages/buyer/address/index', 2)
            }

        }
    },
    closePhoneModule: function () {
        this.setData({
            phoneMS: false
        })
    },
    // 预支付
    submitPayment(batchId) {
        let self = this
        let params = {
            "appid": API.APP_ID,
            "batchId": batchId,
            "body": "小程序 商品秒杀",
            "openId": wx.getStorageSync('openid')
        }
        AuthProvider.getAccessToken().then(token => {
            return wxRequest.fetch(API.submitPayment, { type: 'bearer', value: token }, params, "POST")
        }).then(res => {
            //console.log(res, '预支付')
            if (res.data.resultCode == '100') {
                wx.requestPayment({
                    'timeStamp': res.data.resultContent.timeStamp,
                    'nonceStr': res.data.resultContent.nonceStr,
                    'package': res.data.resultContent.package,
                    'signType': res.data.resultContent.signType,
                    'paySign': res.data.resultContent.sign,
                    'success': function (res) {
                        // 支付成功
                        util.pageGo('/pages/buyer/success/index?scene=' + self.data.goodId, 2)
                    },
                    'fail': function (res) {
                        util.ErrorTips(self, '秒杀失败')
                    },
                    'complete': function () {
                        self.setData({ paymentFlag: false })
                    }
                })
            } else {
                util.ErrorTips(self, '秒杀失败')
                self.setData({ paymentFlag: false })
            }
        })
    },
    // 订阅商品
    bookGood: function () {
        let self = this
        let { goodId, goodData } = this.data
        let params = {
            "goodId": goodData.id ? goodData.id : goodId,
            "openId": wx.getStorageSync('openid'),
            "type": 1
        }
        if (!goodId) {
            util.ErrorTips(self, '商品数据加载中...');
        } else {
            AuthProvider.getAccessToken().then(token => {
                return wxRequest.fetch(API.bookGood, { type: 'bearer', value: token }, params, "POST")
            }).then(res => {
                //console.log('订阅提醒')
                if (res.data.resultCode == '100') {
                    util.ErrorTips(self, '预约成功')
                }
            })
        }
    },
    // 预计抢购倒计时
    countdown: function () {
        let current = new Date().getTime()
        // //console.log(current)
        let { goodData, effectiveDate } = this.data
        //console.log('--------')
        //console.log(current)
        //console.log(effectiveDate)
        if (current < effectiveDate) {
            this.setData({
                timeLeft: util.formatTime(Math.floor((effectiveDate - current) / 1000))
            })
            setTimeout(this.countdown, 500)
        } else {
            //console.log('###########')
            this.setData({
                secKillFlag: true
            })
        }
    },

    // 抢购倒计时时间
    countdownBuy: function () {
        let current = new Date().getTime()
        // console.log(current)
        let { goodData, expiredDate } = this.data
        if (current < expiredDate) {
            this.setData({
                timeLeftBuy: util.formatTime(Math.floor((expiredDate - current) / 1000))
            })
            setTimeout(this.countdownBuy, 500)
        } else {
            this.setData({ expiredFlag: true })
        }
    },
    // 模板消息
    formSubmit: function (e) {
        let params = {
            "appId": API.APP_ID,
            "formId": e.detail.formId,
            "openId": wx.getStorageSync('openid')
        }
        AuthProvider.getAccessToken().then(token => {
            wx.request({
                url: API.templateNews,
                data: params,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    "Authorization": 'bearer ' + token //base64加密liz-youli-wx:secret
                },
                success: function (e) {
                    //console.log('发送成功')
                }
            })
        })
    }
})

