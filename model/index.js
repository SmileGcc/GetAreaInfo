'use strict';

let Sequelize = require('sequelize');
let config = require('../config');
let sequelize = new Sequelize(config.db);

sequelize.sync();

module.exports = {
    City: sequelize.import('./city.js'),
    Province: sequelize.import('./province.js'),
    Region: sequelize.import('./region.js'),
    sequelize: sequelize
};