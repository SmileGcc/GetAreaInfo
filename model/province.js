'use strict';

module.exports = function(sequelize, DataTypes) {
    let Province = sequelize.define('Province', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '省级名称 例: 广东省、北京市',
        },
        short_name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '省级名称简写 例: 广东、北京',
        },
        region_code: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '行政区划代码',
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '1:有效  2：无效',
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: '创建时间',
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: '更新时间',
        }
    }, {
        freezeTableName: false, // Model 对应的表名将与model名相同
        tableName: 'province',
        timestamps: false,
        comment: '行政区域省级表'
    });
    Province.associate = function(models) {
        Province.hasMany(models.City, {
            foreignKey: 'province_id',
            targetKey: 'id'
        });
        Province.hasMany(models.Region, {
            foreignKey: 'province_id',
            targetKey: 'id'
        });
    };
    return Province;
};



