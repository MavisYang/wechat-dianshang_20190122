// pages/sell/withdraw/index.js

const app = getApp();
let util = require('../../../utils/util');
let API = require('../../../utils/api');
let SELL = require('../../../utils/sellFetch');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        popErrorMsg: null,//错误提示
        stop: true,//阻止机制
        cashMoney: '0.00',//最大提现金额
        cumulativeIncome: '0.00',//累计收益
        cashMoneyValue: null,//提现金额
        cashStatus: false,
        dataList: [],
        dataListLen: 0,
        pageInfo: {
            currentPage: 0,
            pageSize: 10,
            totalPage: 0
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let data = {
            currentPage: 0,
            pageSize: 10
        };

        SELL.loadAccountInfo(res => {
            "use strict";
            //console.log(res);
            if (res.data.resultCode === '100') {
                this.setData({
                    cashMoney: res.data.resultContent.amount,
                    cumulativeIncome: res.data.resultContent.cumulativeIncome
                })
            }
        });
        SELL.getProductList(data, res => {
            "use strict";
            //console.log(res);
            if (res.data.resultCode === '100') {
                this.setData({
                    dataList: res.data.resultContent,
                    dataListLen: res.data.resultContent.length,
                    pageInfo: res.data.pageInfo
                })
            } else {
                util.ErrorTips(this, res.data.detailDescription)
            }
        })
    },
    //获取列表数据
    getListLower: function () {
        "use strict";
        if (this.data.stop) {
            this.setData({
                stop: false
            });
            let pageInfo = this.data.pageInfo;
            let data = {
                currentPage: 0,
                pageSize: pageInfo.pageSize + 10
            };
            SELL.getProductList(data, res => {
                "use strict";
                //console.log(res);
                if (res.data.resultCode === '100') {
                    if (res.data.resultContent.length > this.data.dataListLen) {
                        this.setData({
                            dataList: res.data.resultContent,
                            pageInfo: res.data.pageInfo,
                            dataListLen: res.data.resultContent.length,
                            stop: true
                        })
                    } else {
                        util.ErrorTips(this, '没有更多了');
                        this.setData({
                            stop: true
                        })
                    }
                } else {
                    util.ErrorTips(this, res.data.detailDescription)
                }
            })
        }
    },
    // 终止活动
    stopActivity: function (event) {
        "use strict";
        let _this = this;
        if (_this.data.stop) {
            wx.showModal({
                title: "终止活动",
                content: "确认后直接关闭活动，商品不可再被购买。",
                cancelColor: "#444",
                confirmColor: "#F03340",
                success: function (e) {
                    if (e.confirm) {
                        console.log("Y");
                        _this.setData({
                            stop: false
                        });
                        SELL.stopActivity(event.currentTarget.dataset.id, result => {
                            if (result.data.resultCode === '100') {
                                let data = {
                                    currentPage: 0,
                                    pageSize: 10
                                };
                                SELL.getProductList(data, res => {
                                    "use strict";
                                    if (res.data.resultCode === '100') {
                                        _this.setData({
                                            dataList: res.data.resultContent,
                                            pageInfo: res.data.pageInfo,
                                            dataListLen: res.data.resultContent.length,
                                            stop: true
                                        })
                                    } else {
                                        util.ErrorTips(_this, res.data.detailDescription)
                                    }
                                })
                            }
                        })
                    }
                    if (e.cancel) {
                        console.log("N")
                    }
                }
            })
        }
    },
    //去分享
    goShare: function (e) {
        "use strict";
        SELL.longToshort(e.currentTarget.dataset.id, res => {
            if (res.data.resultCode === '100') {
                util.pageGo('/pages/sell/webView/index?updateState=1&scene=' + res.data.resultContent, 1);
            }
        });
    },
    // 去售后记录
    goRecord: function (e) {
        "use strict";
        //console.log(e.currentTarget.dataset.id)
        let path = `/pages/sell/record/index?scene=${e.currentTarget.dataset.id}`;
        util.pageGo(path, 1)
    },
    goHistory: function () {
        let path = '/pages/sell/history/index';
        util.pageGo(path, 1)
    },
    //提现模态
    cashAllMoney: function (e) {
        "use strict";
        this.setData({
            cashMoneyValue: e.currentTarget.dataset.money
        })
    },
    showCash: function () {
        this.setData({
            cashStatus: true
        })
    },
    hideCash: function () {
        this.setData({
            cashStatus: false
        })
    },
    //输入提现金额
    iptCashMoney: function (e) {
        //console.log(e.detail.value);
        if (e.detail.value < this.data.cashMoney) {
            this.setData({
                cashMoneyValue: e.detail.value
            })
        } else {
            this.setData({
                cashMoneyValue: this.data.cashMoney
            });
            util.ErrorTips(this, '最多提现' + this.data.cashMoney + '元')
        }
    },
    // 确认提现
    confirmCash: function (e) {
        "use strict";
        if (this.data.stop) {
            this.setData({
                stop: false
            });
            let dataParams = {
                amount: this.data.cashMoneyValue,
                appId: API.APP_ID,
                openId: wx.getStorageSync('openid'),
                withDrawDes: '好物来活动收入'
            };
            SELL.withDrawPay(dataParams, res => {
                //console.log(res);
                if (res.data.resultCode === '100') {
                    util.successShowText('提现成功');
                    this.setData({
                        stop: true,
                        cashStatus: false
                    });
                    SELL.loadAccountInfo(res => {
                        "use strict";
                        //console.log(res);
                        if (res.data.resultCode === '100') {
                            this.setData({
                                cashMoney: res.data.resultContent.amount,
                                cumulativeIncome: res.data.resultContent.cumulativeIncome
                            })
                        }
                    });
                } else {
                    this.setData({
                        cashStatus: false
                    });
                    util.ErrorTips(this, res.data.detailDescription)
                }

            });
            // util.successShowText('提现成功')
        } else {
            //console.log('确认提现111')
        }
    }
})