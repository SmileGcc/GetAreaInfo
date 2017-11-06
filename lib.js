'use strict';

let request = require('request');
let pinyin = require("pinyin");
let Segment = require('segment');

let segment = new Segment();
segment.useDefault();

//获取省简短名称
let getProvinceShortName = function (province) {
    if(province.indexOf('内蒙古自治区')> -1){
        return '内蒙古'
    }
    if(province.indexOf('广西壮族自治区')> -1){
        return '广西'
    }
    if(province.indexOf('西藏自治区')> -1){
        return '西藏'
    }
    if(province.indexOf('宁夏回族自治区')> -1){
        return '宁夏'
    }
    if(province.indexOf('新疆维吾尔自治区')> -1){
        return '新疆'
    }
    if(province.indexOf('特别行政区') > -1){
        return province.substr(0,province.length - 5)
    }
    if( province.charAt(province.length - 1) === '省'||
        province.charAt(province.length - 1) === '市'){
        return province.substr(0,province.length - 1);
    }
    return '';
};

let getCityOrRegionInfo = function(province, city, callback){
    let data = 'shengji=' + province;
    data = city? data+ '&diji=' + city : data;
    request({
        method: 'POST',
        url: 'http://xzqh.mca.gov.cn/selectJson',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            "Content-Type":	"application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: data
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if(!body){
                return callback('请求数据错误')
            }
            let infoArr = body.split('},{');
            let result = [];
            if(infoArr[0] === '[]'){
                console.log('获取数据为空' + data);
                return callback(null, result);
            }
            for(let i=0; i<infoArr.length; i++){
                let info = infoArr[i];
                let reg1 = /"quHuaDaiMa":"(\d*)"/g;
                let regionCode = info.match(reg1)[0].toString().replace(reg1,'$1');  //行政区划代码
                let reg2 = /"quhao":"(\d*)"/g;
                let areaCode = info.match(reg2)[0].toString().replace(reg2,'$1');  //区号
                //区号第一个0去掉
                if(areaCode.indexOf('0') === 0) {
                    areaCode = areaCode.substr(1,areaCode.length-1)
                }
                if(!city) {  //获取地级
                    let reg = /"diji":"([\u4e00-\u9FA5]+)/g;
                    let city = info.match(reg)[0].toString().replace(reg,'$1');  //city: 贵阳市
                    result.push({
                        city: city,
                        regionCode: regionCode,
                        areaCode: areaCode
                    })
                }else{  //获取县级信息
                    let reg = /"xianji":"([\u4e00-\u9FA5]+)/g;
                    let region = info.match(reg)[0].toString().replace(reg,'$1');  //city: 贵阳市
                    result.push({
                        region: region,
                        regionCode: regionCode,
                        areaCode: areaCode
                    })
                }
            }
            return callback(null, result);
        }else{
            return callback(error);
        }
    });
};

let getABName = function (name) {
    let str = '';
    pinyin(name , {
        style: pinyin.STYLE_FIRST_LETTER
    }).forEach(function (item) {
        str += item;
    });
    return str.toUpperCase();
};

//获取城市名称
let getCityShortName = function (name) {
    let cityShortName = name;
    if(['市', '盟'].indexOf(name.substr(name.length-1,1)) > -1){  //末尾包含
        cityShortName = name.substr(0, name.length-1);
    }else if ( ['黔西南', '黔东南'].indexOf(name.substr(name.length-3,3)) > -1) {//直接取三两位
        cityShortName = name.substr(0, 3);
    } else if ( ['陵水', '保亭', '琼中', '黔南', '海西'].indexOf(name.substr(name.length-2,2)) > -1) {//直接取前两位
        cityShortName = name.substr(0, 2);
    } else if ( ['自治州', '自治县'].indexOf(name.substr(name.length-3,3)) > -1) { //末尾包含
        name = name.substr(0, name.length-3);
        let result = segment.doSegment(name, null);  //分词获取市名称 取第一位
        cityShortName = result[0].w;
    }else if ( ['地区', '林区'].indexOf(name.substr(name.length-2,2)) > -1 ) { //末尾包含
        name = name.substr(0, name.length-2);
        let result = segment.doSegment(name, null);  //分词获取市名称 取第一位
        cityShortName = result[0].w;
    }
    return cityShortName;
};

let getRegionShortName = function (name) {
    let shortName = name;
    if( name.length === 2){
        shortName = name;
    } else if( ['自治县'].indexOf(name.substr(name.length-3,3)) > -1 ) { //末尾包含
        name = name.substr(0, name.length-3);
        let result = segment.doSegment(name, null);  //分词 取第一位
        shortName = '';
        if(result[0].w.length === 1){  //只有一位
            result.forEach(function (obj) {
                if(obj.w.substr(obj.w.length-1,1) !== '族'){ //拼接不带‘族’的分词
                    shortName += obj.w;
                }
            })
        }else{
            shortName = result[0].w;
        }
    } else if( ['矿区'].indexOf(name.substr(name.length-2,2)) > -1 ) { //末尾包含
        shortName = name.substr(0, name.length-2);
    } else if(['市', '区', '县'].indexOf(name.substr(name.length-1,1)) > -1){//末尾包含
        shortName = name.substr(0,name.length-1);
    }
    if(shortName.length === 1){
        shortName = name;
    }
    return shortName;
};

module.exports = {
    getProvinceShortName,
    getCityOrRegionInfo,
    getABName,
    getCityShortName,
    getRegionShortName
};