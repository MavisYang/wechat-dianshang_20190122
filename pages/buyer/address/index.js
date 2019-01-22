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
        fromData: {
            name: '',
            phone: '',
            address: ''
        },
        paymentFlag: false,//是否可提交
        productData: '',
        skuId: '',
        stop: true,//阻止机制
        popErrorMsg: false,
        goodId: null,
        bargainBuyId: null,
        phone: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log(JSON.parse(options.dataParams))
        let dataParams = JSON.parse(options.dataParams)
        let _this = this;
        if (options.dataParams) {
            console.log("砍价快递");
            this.setData({
                bargainBuyId: dataParams.bargainBuyId,
                skuId: dataParams.productSkuId,
                phone: dataParams.productDescription.find(item => item.type === 9),
                productData: dataParams,
                goodId: dataParams.productId,
                type: 1
            });
        } else {
            console.log("秒杀快递");
            _this.setData({
                productData: wx.getStorageSync('productData'),
                skuId: wx.getStorageSync('skuId'),
                goodId: wx.getStorageSync('productData').id,
                type: 0
            })
        }
    },
    addAddress: function () {
        let _this = this
        if (wx.chooseAddress) {
            wx.chooseAddress({
                success: function (res) {
                    let adr = res.provinceName + res.cityName + res.countyName + res.detailInfo;
                    _this.setData({
                        'fromData.address': adr,
                        'fromData.name': res.userName,
                        'fromData.phone': res.telNumber,
                        paymentFlag: true
                    })
                },
                fail: function (req) {
                    //console.log(2);
                    wx.showModal({
                        title: '提示',
                        content: '您未正确选择地址，将无法使用收货地址，请重新授权或选择地址',
                        mask: true,
                        confirmColor: '#F45C43',
                        success: function (res) {
                            if (res.confirm) {
                                //打开授权开关界面，让用户手动授权
                                wx.openSetting({
                                    success: function (res) {
                                        if (res.authSetting['scope.address']) {
                                            wx.chooseAddress({
                                                success: res => {
                                                    //console.log(res);
                                                    let adr = res.provinceName + res.cityName + res.countyName + res.detailInfo;
                                                    _this.setData({
                                                        'fromData.address': adr,
                                                        'fromData.name': res.userName,
                                                        'fromData.phone': res.telNumber,
                                                        paymentFlag: true
                                                    })
                                                }
                                            })
                                        } else {
                                            //console.log('reject authrize');
                                        }
                                    }
                                })

                            } else if (res.cancel) {
                                return
                            }
                        }
                    })
                }
            })
        } else {
            util.ErrorTips(_this, '当前微信版本不支持chooseAddress');
        }
    },

    submitOrder() {
        "use strict";
        let self = this
        //console.log(self.data.paymentFlag, 'paymentFlag');
        if (!self.data.paymentFlag) {
            util.ErrorTips(self, '填写收货信息')
            return
        }
        let params;
        let url;
        if (self.data.type) {
            console.log("砍价");
            url = API.bargainSubmit;
            params = {
                "bargainBuyId": self.data.bargainBuyId,
                "phone": self.data.phone ? self.data.phone.description : null,
                "proPayment": {
                    "appid": API.APP_ID,
                    "body": "小程序 商品砍价",
                    "openId": wx.getStorageSync('openid')
                },
                "quantity": 1,
                "skuId": self.data.skuId,
                "receiveAddress": self.data.fromData.address,
                "receiveName": self.data.fromData.name,
                "receivePhone": self.data.fromData.phone,
                "takeWay": 2//1:到店取货 2快递
            }
        } else {
            console.log("秒杀");
            url = API.submitOrder;
            params = {
                "proPayment": {
                    "appid": API.APP_ID,
                    "body": "小程序 商品秒杀",
                    "openId": wx.getStorageSync('openid')
                },
                "quantity": 1,
                "skuId": self.data.skuId,
                "receiveAddress": self.data.fromData.address,
                "receiveName": self.data.fromData.name,
                "receivePhone": self.data.fromData.phone,
                "takeWay": 2//1:到店取货 2快递
            };
        }
        AuthProvider.getAccessToken().then(token => {
            return wxRequest.fetch(url, { type: 'bearer', value: token }, params, "POST")
        }).then(res => {
            console.log('提交订单')
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
                            wx.removeStorageSync("bargainBuyId");
                            self.setData({ paymentFlag: false });
                            util.pageGo('/pages/buyer/success/index?scene=' + self.data.goodId, 2);
                            // 清除缓存
                        },
                        'fail': function (res) {
                            util.ErrorTips(self, '购买失败')

                        },
                    })
                }
            } else {
                util.ErrorTips(self, '购买失败')
            }
        })
    },
})