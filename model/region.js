'use strict';

module.exports = function(sequelize, DataTypes) {
    let Region = sequelize.define('Region', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '市级名称 例: 深圳市、北京市',
        },
        short_name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '市级名称简写 例: 深圳、北京',
        },
        province_id: {
            type: DataTypes.INTEGER,
            comment: '省级ID',
        },
        city_id: {
            type: DataTypes.INTEGER,
            comment: '市级ID',
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
        tableName: 'region',
        timestamps: false,
        comment: '行政区域县级表',
        indexes: [
            {
                fields: [ 'province_id', 'city_id'],
            },
        ]
    });
    Region.associate = function(models) {
        Region.belongsTo(models.Province, {
            foreignKey: {
                allowNull: true,
                name: 'province_id'
            }
        });
        Region.belongsTo(models.City, {
            foreignKey: {
                allowNull: true,
                name: 'city_id'
            }
        });
    };
    return Region;
};



