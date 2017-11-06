'use strict';

let db = require('./model');
let request = require('request');
let iconv = require('iconv-lite');
let co = require('co');
let Promise = require('bluebird');
let lib = Promise.promisifyAll(require('./lib'));
let regionMapping = require('./region.mapping');

//不存在就插入县级记录
let findOrCreateRegion = co.wrap(function* (province, city, provinceId, cityId){
    let regionInfoArr = yield lib.getCityOrRegionInfoAsync(province, city);
    console.log('遍历区数据');
    for(let i=0; i<regionInfoArr.length; i++){
        let obj = regionInfoArr[i];
        let regionName = obj.region;
        let cityRegionCode = obj.regionCode;
        let shortName = lib.getRegionShortName(regionName);
        //更新区号由县级取
        if (i === 0 && ['北京市', '上海市', '天津市', '重庆市'].indexOf(city) > -1) {
            yield db.City.update({ area_code: obj.areaCode },{
                where: { name: city, status: 1, province_id: provinceId }
            });
        }
        //直辖县级行政单位要从县级数据更新到市级
        if (city.indexOf('直辖县级行政单位') > -1) {
            let shortName = lib.getCityShortName(regionName);
            let abName = lib.getABName(shortName);
            let areaCode = obj.areaCode;
            let result = yield db.City.findOrCreate({
                where: { name: regionName, status: 1, province_id: provinceId },
                defaults: {
                    name: regionName,
                    short_name: shortName,
                    ab: abName,
                    province_id: provinceId,
                    region_code: cityRegionCode,
                    area_code: areaCode,
                    status: 1,
                    updated_at: new Date(),
                    created_at: new Date()
                }
            });
            cityId =  result[0].dataValues.id;
        }
        console.log('更新Region数据库 县:' + regionName);
        yield db.Region.findOrCreate({
            where: { name: regionName, status: 1, province_id: provinceId, city_id: cityId,},
            defaults: {
                name: regionName,
                short_name: shortName,
                province_id: provinceId,
                city_id: cityId,
                region_code: cityRegionCode,
                status: 1,
                updated_at: new Date(),
                created_at: new Date()
            }
        });
    }
});

let findOrCreateTaiwanCity = co.wrap(function* (provinceId, cityName, regionCode){
    let cityRegionCode = regionCode;  //行政区划代码
    let cityShortName = lib.getCityShortName(cityName);  //短名称
    let cityAreaCode = regionCode;  //区号使用行政区划代码 防止重复
    let abName = lib.getABName(cityShortName);  //拼音首字母简写
    if(regionMapping.MORE[cityName]){  //原来已存在的区号保留
        cityAreaCode = regionMapping.MORE[cityName];
        abName = regionMapping.MERCHANT_AB[regionMapping.MORE[cityName]]
    }
    console.log('更新City数据库 市:' + cityName);
    yield db.City.findOrCreate({
        where: { name: cityName, status: 1, province_id: provinceId },
        defaults: {
            name: cityName,
            short_name: cityShortName,
            ab: abName,
            province_id: provinceId,
            region_code: cityRegionCode,
            area_code: cityAreaCode,
            status: 1,
            updated_at: new Date(),
            created_at: new Date()
        }
    });
});

//不存在就插入市级记录
let findOrCreateCity = co.wrap(function* (province, provinceId){
    let cityInfoArr = yield lib.getCityOrRegionInfoAsync(province, null);
    if( province.indexOf('台湾') > -1 ){ //只支持台北
        yield findOrCreateTaiwanCity(provinceId, '台北市', '710001');
        return;
    }
    if( province.indexOf('澳门') > -1 ||
        province.indexOf('香港') > -1 ){  //暂时不支持
        return;
    }
    for(let i=0;i<cityInfoArr.length;i++){
        let obj = cityInfoArr[i];
        let cityName = obj.city;   //市名称
        let cityRegionCode = obj.regionCode;  //行政区划代码
        let cityShortName = lib.getCityShortName(cityName);  //短名称
        let cityAreaCode = obj.regionCode;  //区号使用行政区划代码 防止重复
        let abName = lib.getABName(cityShortName);  //拼音首字母简写
        if(regionMapping.MORE[cityName]){  //原来已存在的区号保留
            cityAreaCode = regionMapping.MORE[cityName];
            abName = regionMapping.MERCHANT_AB[regionMapping.MORE[cityName]]
        }
        console.log('更新City数据库 市:' + cityName);
        let cityId = 0;
        //非直辖县级行政单位直接更新
        if (cityName.indexOf('直辖县级行政单位') < 0) {
            let result = yield db.City.findOrCreate({
                where: { name: cityName, status: 1, province_id: provinceId },
                defaults: {
                    name: cityName,
                    short_name: cityShortName,
                    ab: abName,
                    province_id: provinceId,
                    region_code: cityRegionCode,
                    area_code: cityAreaCode,
                    status: 1,
                    updated_at: new Date(),
                    created_at: new Date()
                }
            });
            cityId =  result[0].dataValues.id;
        }
        yield findOrCreateRegion(province, cityName, provinceId, cityId);
    }

});

//不存在就插入省级记录
let findOrCreateProvince = co.wrap(function* (provinceInfo){
    let reg = /"shengji":"([\u4e00-\u9FA5]+\([\u4e00-\u9FA5][、]*[\u4e00-\u9FA5]*\))/g;
    let province = provinceInfo.match(reg)[0].toString().replace(reg,'$1');  //province: 云南省(滇、云)
    let provinceName = province.split('(')[0];  //去掉括号部分
    let reg1 = /"quHuaDaiMa":"(\d*)"/g;
    let regionCode = provinceInfo.match(reg1)[0].toString().replace(reg1,'$1');  //行政区划代码
    console.log('更新Province数据库 省:' + province);
    let result = yield db.Province.findOrCreate({
        where: { name: provinceName, status: 1 },
        defaults: {
            name: provinceName,
            short_name: lib.getProvinceShortName(provinceName),
            region_code: regionCode,
            status: 1,
            updated_at: new Date(),
            created_at: new Date()
        }
    });
    yield findOrCreateCity(province, result[0].dataValues.id);
});

let finish = function () {
    console.log('run end ' + new Date());
    process.exit();
};

let run = function () {
    console.log('run start ' + new Date());
    request( {
        method: 'GET',
        url: 'http://xzqh.mca.gov.cn/map',
        headers: {
            "Accept-Encoding":	"gzip, deflate"
        },
        encoding: null
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            try{
                body = iconv.decode(body, "gbk");
                let provinceInfoStr = body.split('var json = [')[1].split('];')[0];
                let infoArr = provinceInfoStr.split('},{');
                co(function* () {
                    for(let i=0;i<infoArr.length;i++){
                        yield findOrCreateProvince(infoArr[i]);
                    }
                    finish()
                }).catch(err=>{
                    console.log('更新失败: ' + err);
                    finish();
                });
            }catch (e){
                console.log('数据解析错误:' + e);
                finish();
            }
        }
    });
};

//爬取数据导入MySQL
run();