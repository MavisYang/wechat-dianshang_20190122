// pages/sell/record/index.js
const app = getApp();
let util = require('../../../utils/util');
let SELL = require('../../../utils/sellFetch');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        popErrorMsg: null,//错误提示
        stop: true,//阻止机制
        id: null,//商品id
        dataListLen: 0,
        dataList: {
            orderRecords: [],
            skuName: '',
            skuPic: null,
            takeWay: 1//取货方式，1--到店取货 2--快递 3--无需取货
        },
        pageInfo: {
            currentPage: 0,
            pageSize: 10
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        SELL.shortTolong(options.scene, result => {
            "use strict";
            if (result.data.resultCode === '100') {
                let data = {
                    id: result.data.resultContent,
                    currentPage: 0,
                    pageSize: 10
                };
                SELL.getOrdersList(data, res => {
                    "use strict";
                    if (res.data.resultCode === '100') {
                        this.setData({
                            id: result.data.resultContent,
                            pageInfo: res.data.pageInfo,
                            dataListLen: res.data.resultContent.orderRecords.length,
                            dataList: formatList(res.data.resultContent)
                        })
                    } else {
                        util.ErrorTips(this, res.data.detailDescription)
                    }

                })
            }
        });
    },
    getListLower: function () {
        "use strict";
        if (this.data.stop) {
            this.setData({
                stop: false
            });
            let data = {
                id: this.data.id,
                currentPage: 0,
                pageSize: this.data.pageInfo.pageSize + 10
            };
            SELL.getOrdersList(data, res => {
                "use strict";
                //console.log(res);
                if (res.data.resultCode === '100') {
                    if (res.data.resultContent.orderRecords.length > this.data.dataListLen) {
                        this.setData({
                            pageInfo: res.data.pageInfo,
                            stop: true,
                            dataListLen: res.data.resultContent.orderRecords.length,
                            dataList: formatList(res.data.resultContent)
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
    // 添加快递照片
    addExpressPhotos(e) {
        let _this = this;
        //console.log(e.currentTarget.dataset.ftitemid)

        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success(res) {
                const src = res.tempFilePaths[0]
                util.downloadImg(src, res => {
                    //console.log(res,'res'); //{id:'',url:'',type:'image'}
                    if (res) {
                        util.successShowText('添加成功');
                        let dataS = {
                            ftItemId: e.currentTarget.dataset.ftitemid,
                            imagePath: res.url
                        }
                        SELL.fulfillment(dataS, result => {
                            "use strict";
                            if (result.data.resultCode === '100') {
                                let data = {
                                    id: _this.data.id,
                                    currentPage: 0,
                                    pageSize: 10
                                };
                                SELL.getOrdersList(data, res => {
                                    "use strict";
                                    if (res.data.resultCode === '100') {
                                        _this.setData({
                                            pageInfo: res.data.pageInfo,
                                            dataList: formatList(res.data.resultContent),
                                            stop: true
                                        })
                                    } else {
                                        util.ErrorTips(_this, res.data.detailDescription)
                                    }
                                })
                            }
                        });
                    } else {
                        util.successShowText('添加失败')
                    }
                })
            },
            fail: function (req) {

            }
        })

    }
})


function formatList(arr) {
    arr.orderRecords.map(item => {
        "use strict";
        item.payType = formatPayType(item.payType);
        item.createTime = formatKillDate(item.createTime);
    });
    return arr;
}
var formatKillDate = function (str) {
    return str.replace('T', ' ')
};
var formatPayType = function (str) {
    switch (str) {
        case 8:
            return '到店支付';
            break;
        case 3:
            return '在线支付';
            break;
    }
}