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
    yield db.Province.findOrCreate({
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
    finish()
}).catch(err=>{
    console.log('更新失败: ' + err);
    finish();
});


//使用旧的数据导入MySQL
run();