//app.js
let wxRequest = require('./utils/wxRequest.js');
let API = require('./utils/api.js');
let AuthProvider = require('./utils/AuthProvider');
let util = require('./utils/util');


App({
    onLaunch: function () {
        // 微信预登陆
        wx.login({
            success: function (e) {
                console.log("登录成功");
            }
        })
    },
    // 全局数据对象
    globalData: {
        userInfo: null
    },
    // 全局获取用户信息
    getUserInfo: function (res, type, callback) {
        let _this = this;
        console.log('---获取用户信息---');
        console.log(res);
        console.log('----------');
        if (res.detail.errMsg == 'getUserInfo:fail auth deny') {
            wx.showModal({
                title: '用户授权',
                content: '本小程序需用户授权，请重新点击按钮授权。',
                mask: true,
                confirmColor: '#F45C43',
                success: function (res) {
                }
            })
        } else if (res.detail.errMsg == 'getUserInfo:ok') {
            let userInfo = res.detail.userInfo;
            _this.globalData.userInfo = userInfo;
            wx.setStorageSync('userinfo', userInfo);
            callback({
                hasUserInfo: true,
                userInfo: userInfo
            });
            _this.wxLogin(res.detail.encryptedData, res.detail.iv, type)
        }
    },
    //授权登录，拿token
    wxLogin: function (encryptedData, iv, type) {
        wx.setStorageSync('userType', type);//user登录方式，sell，buy
        // body...
        wx.login({
            success: function (res) {
                "use strict";
                if (res.code) {
                    let params = {
                        appid: API.APP_ID,
                        code: res.code,
                        encryptedData: encryptedData,
                        iv: iv
                    };
                    if (type === 'sell') {
                        wxRequest.fetch(API.authLogin + '?_iscreateUser=false', null, params, "POST").then(res => {
                            "use strict";
                            // console.log()
                            if (res.data.resultCode === '100') {
                                console.log(res.data.resultContent);
                                wx.setStorageSync('unionid', res.data.resultContent.unionId);
                                wx.setStorageSync('openid', res.data.resultContent.openId);
                                util.pageGo('/pages/sell/apply/index', 1)
                                // AuthProvider.onLogin(type, res => {
                                //     console.log(res, '获取token')
                                // })
                            } else {
                                console.log('error')
                            }
                        })
                    } else if (type === 'buy') {
                        wxRequest.fetch(API.authLogin, null, params, "POST").then(res => {
                            "use strict";
                            // console.log()
                            if (res.data.resultCode === '100') {
                                console.log(res.data.resultContent);
                                wx.setStorageSync('unionid', res.data.resultContent.unionId);
                                wx.setStorageSync('openid', res.data.resultContent.openId);
                                AuthProvider.onLogin(type, null, res => {
                                    console.log(res, '获取token')
                                })
                            } else {
                                console.log('error')
                            }
                        })
                    }
                }
            }
        });
    },
    // 获取全局属性 用户信息，登录状态
    getGlobalDatas: function (canIUse, callback) {
        let _this = this;
        let userinfos = wx.getStorageSync('userinfo');
        if (userinfos.hasOwnProperty('nickName')) {
            console.log(userinfos, '获取全局属性 用户信息，登录状态');
            callback({
                userInfo: userinfos,
                hasUserInfo: true
            })
        } else {
            console.log('globalData userInfo')
            if (_this.globalData.userInfo) {
                callback({
                    userInfo: app.globalData.userInfo,
                    hasUserInfo: true
                })
            } else if (canIUse) {
                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                _this.userInfoReadyCallback = res => {
                    callback({
                        userInfo: res.userInfo,
                        hasUserInfo: true
                    })
                }
                callback({
                    userInfo: null,
                    hasUserInfo: false
                })
            } else if (!canIUse) {
                console.log("low version");
                wx.showModal({ // 向用户提示升级至最新版微信。
                    title: '提示',
                    confirmColor: '#F45C43',
                    content: '微信版本过低，请升级至最新版。',
                    mask: true
                })
            } else {
                // 在没有 open-type=getUserInfo 版本的兼容处理
                wx.getUserInfo({
                    success: res => {
                        _this.globalData.userInfo = res.userInfo
                        callback({
                            userInfo: res.userInfo,
                            hasUserInfo: true
                        })
                        console.log(success)
                    }
                })
            }
        }
    }
});
