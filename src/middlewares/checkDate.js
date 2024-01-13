const {dateTimePattern} = require("../config/regularExpression")

function checkDate(dateTime) {
    if (dateTimePattern.test(dateTime)) {
        return dateTime.replace(dateTimePattern, "$1T$2:00");
    } else {
        throw new Error("잘못된 날짜 형식. 최소 YYYY-MM-DDHH:MM 형태로 넣을것.");
    }
}

module.exports = {checkDate}; // Export the middleware