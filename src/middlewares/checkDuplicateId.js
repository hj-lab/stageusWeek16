const conn = require("../config/database")
const { executeSQL } = require("../modules/sql.js")

// ID 중복 체크 함수

function checkDuplicateId(id) {
    return async (req, res, next) => {
        try{
            const inputId = req.body[id];

            const sql = 'SELECT id FROM account_schema.account WHERE id = $1'; 
            const dbResult = await executeSQL(conn, sql, [inputId]);

            if (dbResult && dbResult.length > 0) {
                // throw new Error("중복된 ID입니다.");
                return next(new Error("중복된 ID입니다."))
            }

            next();

        }catch(e){
            next(e);
        }
    }
}

module.exports = { checkDuplicateId }