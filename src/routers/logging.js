const router = require("express").Router();
const { mongoDBConnect } = require("../config/mongoDB");
const { authenticateAdmin } = require("../middlewares/authenticateAdmin");
const { checkBlank } = require("../middlewares/checkBlank");
const { checkDate } = require("../middlewares/checkDate")

router.get('/', authenticateAdmin, async(req, res, next) => {
    try {
        const { orderBy, startDate, endDate, apiName, id } = req.query;
        const db = await mongoDBConnect();
        let query = {};

        const checkStartDate = checkDate(startDate)
        const checkEndDate = checkDate(endDate)

        if (startDate && endDate) {
            query.loggingTime = {
                $gte: new Date(checkStartDate),
                $lte: new Date(checkEndDate),
            };
        }

        if (apiName) {
            query.apiName = apiName;
        }

        if (id) {
            query.id = id;
        }

        let result;

        if (orderBy === 'desc') {
            result = await db.collection('logs').find(query).sort({ loggingTime: -1 }).toArray();
        } else {
            result = await db.collection('logs').find(query).sort({ loggingTime: 1 }).toArray();
        }

        if (!result || result.length === 0) {
            return next(new Error("no data"));
        }

        res.send(result);
    } catch (e) {
        next(e);
    }
});

module.exports = router;