// pages/buyer/bargain/bargain.js
const app = getApp();
let API = require('../../../utils/api')
let util = require('../../../utils/util')
let AuthProvider = require('../../../utils/AuthProvider')
let wxRequest = require('../../../utils/wxRequest')

Page({
    /**
     * 页面的初始数据
     */
    data: {
        stop: true,//阻止机制
        canIUse: wx.canIUse('button.open-type.getUserInfo'),//判断是否支持button微信授权
        hasUserInfo: false,
        userInfo: '',
        popErrorMsg: null,//提示信息
        bargainPriceTip: null,//已砍多少钱
        sharePopMsg: null,//自己砍多少钱
        bargainGoods: null,//商品信息
        friendList: [],//好友砍价
        expiredDate: '',//秒杀过期时间
        timeLeftBargain: '00:00:00',//秒杀剩余时间
        percent: 0,//砍价进度条
        getGoodsStyle: "",//取货方式
        phoneNum: null,//联系方式
        productDes: null,//商品介绍
        activityId: null,//商品活动Id
        bargainBuyId: null,//所属砍价活动Id ,
        id: null,//商品id
        btnStyle: 1,//按钮状态。1我来砍一刀，2呼朋唤友砍一刀，3立即购买，4帮砍一刀，5我也要买
        textEnd:"数据加载中..."
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setStorageSync("userType", "buy");
        console.log(options, '获取的砍价参数');
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

        // 判断是否授权获取用户信息
        app.getGlobalDatas(this.data.canIUse, res => {
            "use strict";
            if (options.scene) {
                if (res.hasUserInfo) {
                    // 鉴权接口
                    console.log("authsec");
                    this.getActivityProductId(options.scene).then(res => {
                        if (options.bargainBuyId) {
                            this.authescBargain(res, options.bargainBuyId);
                        } else {
                            this.authescBargain(res, wx.getStorageSync('bargainBuyId'));
                        }
                    })
                } else {
                    // 非鉴权接口
                    console.log("noauth");
                    this.getActivityProductId(options.scene).then(res => {
                        this.noauthBargain(res);
                    })
                }
            } else if (options.activityId) {
                if (res.hasUserInfo) {
                    // 鉴权接口
                    console.log("authsec");
                    if (options.bargainBuyId) {
                        this.authescBargain(options.activityId, options.bargainBuyId);
                    } else {

                        this.authescBargain(options.activityId, wx.getStorageSync('bargainBuyId'));
                    }
                } else {
                    // 非鉴权接口
                    console.log("noauth");
                    if (options.scene) {
                        this.getActivityProductId(options.scene).then(res => {
                            this.noauthBargain(res);
                        })
                    }
                    if (options.activityId) {
                        this.noauthBargain(options.activityId, options.bargainBuyId);
                    }

                }
            }
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            })
        });
        //判断有scene时，进入非鉴权接口拿参数
    },
    // 获取 用户信息
    getUserInfo: function (e) {
        let _this = this;
        app.getUserInfo(e, 'buy', res => {
            console.log(res, '鉴权回到');
            this.setData({
                hasUserInfo: res.hasUserInfo,
                userInfo: res.userInfo
            })
            let timer = setInterval(() => {
                if (wx.getStorageSync("access_token")) {
                    clearInterval(timer);
                    _this.authescBargain(_this.data.activityId, _this.data.bargainBuyId)
                } else {
                    console.log("刷新接口")
                }
            }, 1000)
        })
    },
    /**
     * 获取砍价商品 activityProductId
     * @param goodId
     */
    getActivityProductId: function (goodId) {
        let url = API.getGoodInfo + '?goodId=' + goodId;
        return wxRequest.fetch(url, null, null, "GET").then(res => {
            if (res.data.resultCode === "100") {
                this.setData({
                    id: res.data.resultContent.id
                });
                return res.data.resultContent.activityProductId
            } else {
                util.ErrorTips(this, res.data.detailDescription);
                return;
            }
        })
    },
    // 秒杀倒计时
    bargainCountdown: function () {
        let { expiredDate } = this.data
        let current = new Date().getTime();//当前时间
        if (current < expiredDate) {
            this.setData({
                timeLeftBargain: util.formatTime(Math.floor((expiredDate - current) / 1000))
            })
            setTimeout(this.bargainCountdown, 500);
        }

    },
    /**
     * 判断按钮状态
     * @param availableBargain 是否能够砍价
     * @param availableBuy 是否能够购买
     * @param isOwner 是否是自己的砍价活动0是1不是
     */
    returnBtnStyle(availableBargain, availableBuy, isOwner,bargainStatus) {
        "use strict";
        if (isOwner != 1) {
            //是自己的砍价活动
            if (availableBargain) {
                this.setData({
                    btnStyle: 1
                })
            } else {
                if (availableBuy) {
                    this.setData({
                        btnStyle: 3
                    })
                } else {
                    if(bargainStatus == 5){
                        this.setData({
                            btnStyle: 6
                        });
                        return ;
                    }
                    this.setData({
                        btnStyle: 2
                    })
                }
            }
        } else {
            // 不是自己的砍价活动
            if (availableBargain) {
                this.setData({
                    btnStyle: 4
                })
            } else {
                this.setData({
                    btnStyle: 5
                })
            }
        }
    },
    //鉴权后获取获取信息
    authescBargain(activityId, bargainBuyId) {
        "use strict";
        AuthProvider.getAccessToken().then(token => {
            let url;
            if (bargainBuyId) {
                url = API.bargainProductAuthsec + `?activityId=${activityId}&bargainBuyId=${bargainBuyId}`
            } else {
                url = API.bargainProductAuthsec + `?activityId=${activityId}`
            }
            return wxRequest.fetch(url, { type: 'bearer', value: token }, null, "GET")
        }).then(result => {
            console.log(result);
            let dataParams = result.data.resultContent;
            this.returnBtnStyle(dataParams.availableBargain, dataParams.availableBuy, dataParams.isOwner,dataParams.bargainStatus);
            compleates(this, dataParams.alreadyBargainPrice, dataParams.bargainPrice);
            this.setData({
                expiredDate: dataParams.expiredDate,
                bargainGoods: dataParams,
                textEnd:dataParams.status!=1?"商品已售罄":"数据加载中...",
                activityId: dataParams.activityId,
                bargainBuyId: dataParams.bargainBuyId,
                friendList: dataParams.friendList,
                id: dataParams.productId ? dataParams.productId : this.data.id,
                getGoodsStyle: dataParams.productDescription.find(item => item.type === 4).description,
                phoneNum: dataParams.productDescription.find(item => item.type === 9),
                productDes: dataParams.productDescription.find(item => item.type === 2).description,
                weChatNo: dataParams.productDescription.find(item => item.type === 7)
            }, () => {
                this.bargainCountdown()
            })
        }).catch(req => {
            console.log(req)
        })
    },
    noauthBargain(activityId, bargainBuyId) {
        "use strict";
        let url;
        if (bargainBuyId) {
            url = API.bargainProductNoauth + `?activityId=${activityId}&bargainBuyId=${bargainBuyId}`
        } else {
            url = API.bargainProductNoauth + `?activityId=${activityId}`
        }
        wxRequest.fetch(url, null, null, "GET").then(result => {
            console.log(result);
            let dataParams = result.data.resultContent;
            this.returnBtnStyle(dataParams.availableBargain, dataParams.availableBuy, dataParams.isOwner,dataParams.bargainStatus);
            this.setData({
                expiredDate: dataParams.expiredDate,
                bargainGoods: dataParams,
                textEnd:dataParams.status!=1?"商品已售罄":"数据加载中...",
                bargainBuyId: dataParams.bargainBuyId,
                activityId: dataParams.activityId,
                friendList: dataParams.friendList,
                id: dataParams.productId ? dataParams.productId : this.data.id,
                getGoodsStyle: dataParams.productDescription.find(item => item.type === 4).description,
                phoneNum: dataParams.productDescription.find(item => item.type === 9),
                productDes: dataParams.productDescription.find(item => item.type === 2).description,
                weChatNo: dataParams.productDescription.find(item => item.type === 7)
            }, () => {
                this.bargainCountdown()
            })
        })
    },
    //我来砍一刀
    selfChop: function () {
        this.openBargain();
    },
    // 立即购买
    subMain() {
        "use strict";
        let self = this;
        if (!this.data.stop) return;
        this.setData({
            stop: false
        });
        let params = {
            "bargainBuyId": this.data.bargainBuyId,
            "phone": this.data.phoneNum ? this.data.phoneNum.description : null,
            "proPayment": {
                "appid": API.APP_ID,
                "body": "小程序 商品砍价",
                "openId": wx.getStorageSync('openid')
            },
            "quantity": 1,
            "skuId": this.data.bargainGoods.productSkuId,
            "receiveAddress": null,
            "receiveName": null,
            "receivePhone": null,
            "takeWay": 1//1:到店取货 2快递
        }
        AuthProvider.getAccessToken().then(token => {
            return wxRequest.fetch(API.bargainSubmit, { type: 'bearer', value: token }, params, "POST")
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
                            wx.removeStorageSync("bargainBuyId");
                            util.pageGo('/pages/buyer/success/index?scene=' + self.data.bargainGoods.productId, 2)
                        },
                        'fail': function (res) {
                            util.ErrorTips(self, '购买失败')
                        },
                        'complete': function () {
                            self.setData({ stop: true })
                        }
                    })
                } else {
                    // 到店支付
                    util.pageGo('/pages/buyer/success/index?scene=' + self.data.bargainGoods.productId, 2)
                }
            } else {
                util.ErrorTips(self, '购买失败')
                self.setData({ stop: true })
            }
        })
    },
    buyNew() {
        if (this.data.hasUserInfo) {
            // 马上抢（立即支付）；跳转到另外的页面支付
            if (!this.data.weChatNo) {
                this.subMain()
            } else {
                util.pageGo(`/pages/buyer/address/index?dataParams=${JSON.stringify(this.data.bargainGoods)}`, 2)
            }

        }
    },
    // 帮ta砍一刀
    helpChop: function (params) {
        AuthProvider.getAccessToken().then(token => {
            return wxRequest.fetch(API.helpBargain + this.data.bargainBuyId, { type: 'bearer', value: token }, null, "POST")
        }).then(res => {
            if (res.data.resultCode === '100') {
                bargainPriceTip(this, res.data.resultContent.price);
                this.authescBargain(this.data.activityId, this.data.bargainBuyId)
            } else {
                util.ErrorTips(this, res.data.detailDescription);
            }
        })
    },
    //我也要买
    hopeChop: function (params) {
        this.openBargain();
    },
    openBargain: function () {
        AuthProvider.getAccessToken().then(token => {
            "use strict";
            return wxRequest.fetch(API.launchBargain + `?activityId=${this.data.activityId}&tenantProductId=${this.data.id}`, { type: 'bearer', value: token }, {}, "POST")
        }).then(res => {
            "use strict";
            if (res.data.resultCode === '100') {
                this.setData({
                    bargainBuyId: res.data.resultContent.bargainBuyId
                });
                sharePopMsg(this, res.data.resultContent.alreadyBargainPrice);
                bargainPriceTip(this, res.data.resultContent.alreadyBargainPrice);
                wx.setStorageSync('bargainBuyId', res.data.resultContent.bargainBuyId);
                this.authescBargain(res.data.resultContent.activityId, res.data.resultContent.bargainBuyId)
            }
            util.ErrorTips(this, res.data.detailDescription)
        }).catch(req => {
            "use strict";
            console.log("思佳接口报错")
        })
    },
    hideBargainShareTips: function () {
        this.setData({
            sharePopMsg: null
        })
    },
    // 发送formid
    formSubmit: function (e) {
        util.formSubmit(e)
    },
    onShareAppMessage: function () {
        let url;
        if(this.data.bargainBuyId){
            url = `pages/buyer/bargain/bargain?activityId=${this.data.activityId}&bargainBuyId=${this.data.bargainBuyId}`
        }else {
            url = `pages/buyer/bargain/bargain?activityId=${this.data.activityId}`;
        }
        return util.openShare(`【￥${this.data.bargainGoods.retailPrice}】` + this.data.bargainGoods.name,
            url,
            this.data.bargainGoods.coverPhoto,
            () => { }
        )
    }
})
function compleates(that, num1, num2) {
    let agr = parseFloat(num1) / (parseFloat(num1) + parseFloat(num2)) * 100;
    let num = agr.toFixed(2) + '%';
    console.log(num);
    that.setData({
        percent: num
    })
}

function sharePopMsg(that, str) {
    that.setData({
        stop: true,
        sharePopMsg: str
    });
}

function bargainPriceTip(that, str) {
    that.setData({
        stop: true,
        bargainPriceTip: str
    });
    hideErrorTips(that);
}

function hideErrorTips(that) {
    let fadeOutTimeout = setTimeout(() => {
        that.setData({
            bargainPriceTip: null
        });
        clearTimeout(fadeOutTimeout);
    }, 2000);
}
