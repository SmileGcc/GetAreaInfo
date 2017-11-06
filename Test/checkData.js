'use strict';

let db = require('../model/index');
let request = require('request');
let iconv = require('iconv-lite');
let co = require('co');
let Promise = require('bluebird');
let lib = Promise.promisifyAll(require('../lib'));
let regionMapping = require('../region.mapping');


let finish = function () {
    console.log('run end ' + new Date());
    process.exit();
};

co(function* () {
    // let provinceArr = yield db.Province.findOne({
    //     where: { status: 1},
    //     include: [{
    //         model: db.City,
    //         as: 'Cities',
    //         where: {status: 1},
    //         attributes: ['name']
    //     }],
    //     attributes: ['name']
    // });
    // console.log(provinceArr);


    // regionArr.forEach(function (region) {
    //     let shortName = lib.getRegionShortName(region.name);
    //     console.log(shortName)
    // });

    // let cityArr = yield db.City.findAll({
    //     where: { status: 1 },
    //     attributes: ['name', 'area_code', 'short_name']
    // });
    // cityArr.forEach(function (city) {
    //     let shortName = lib.getCityShortName(city.name);
    //     console.log(shortName)
    // });

    // for(let name in regionMapping.LESS){
    //
    //     let city = yield db.City.findOne({
    //         where: { short_name: name, status: 1 },
    //         attributes: ['name', 'area_code', 'short_name']
    //     });
    //     if(!city || !city.short_name){
    //         console.error('找不到城市:' + name)
    //         continue;
    //     }
    //     if(city.area_code != regionMapping.LESS[name]){
    //         console.error('区号不一致的城市:' + name)
    //     }
    // }
    finish()
}).catch(err=>{
    console.log('更新失败: ' + err);
    finish();
});

// let Segment = require('segment');
//
// let segment = new Segment();
// segment.useDefault();
// //
// let result = segment.doSegment('长白朝鲜族', null)
// console.log(result);

// let result = lib.getRegionShortName('长白朝鲜族自治县')
// console.log(result);