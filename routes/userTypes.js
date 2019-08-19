var UserType = require('../models//userTypes');
var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
    (async () => {
        let check=[null,null,null,null];
        await UserType.findOne({name: 'User Operator'}).then((user) => {
            check[0]=user;
        },(err) => next(err)).catch((err) => next(err));

        if(check[0]==null){
            await UserType.create({
                name: 'User Operator',
                location_enable: true,
                location_view: true,
                comments: true,
                chat: true,
                download: true,
            });
        }

        await UserType.findOne({name: 'Data Entry'}).then((user) => {
            check[1]=user;
        },(err) => next(err)).catch((err) => next(err));

        if(check[1]==null){
            await UserType.create({
                name: 'Data Entry',
                location_enable: true,
                upload: true,
                chat: true,
            });
        }

        await UserType.findOne({name: 'Review'}).then((user) => {
            check[2]=user;
        },(err) => next(err)).catch((err) => next(err));

        if(check[2]==null){
            await UserType.create({
                name: 'Review',
                location_enable: true,
                location_view: true,
                upload: true,
                comments: true,
                data_entry: true,
                chat: true,
                offer_details: true
            });
        }

        await UserType.findOne({name: 'GB'}).then((user) => {
            check[3]=user;
        },(err) => next(err)).catch((err) => next(err));

        if(check[3]==null){
            await UserType.create({
                name: 'GB',
                location_view: true,
                comments: true,
                chat: true,
                offer_details: true
            });
        }

        return;
    })().then(() => {
        UserType.find().then((types) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(types);
        })
    }).catch((err) => next(err));
});
module.exports = router;