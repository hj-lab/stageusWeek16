const router = require("express").Router()
const redis = require("redis").createClient()
const { checkForm } = require("../middlewares/checkForm")
const { checkDuplicateId } = require("../middlewares/checkDuplicateId")
const { checkSame } = require("../middlewares/checkSame")
const { checkBlank } = require("../middlewares/checkBlank")
const { isLogin } = require("../middlewares/isLogin")
const { isLogout } = require("../middlewares/isLogout")
const { executeSQL } = require("../modules/sql")
const { uuid } = require("../modules/uuid")

const {loggingMiddleware} = require("../config/mongoDB")
// 로깅 미들웨어
router.use(loggingMiddleware);

// 각 파일에서 postgreSQL 연결 (pool)
const conn = require("../config/database");
// 회원가입, 로그인, 로그아웃, id찾기, pw찾기, 정보 보기(나, 다른사람), 내 정보 수정, 회원 탈퇴

// 회원가입 기능
router.post("/", checkForm("id", "pw", "birth", "myName", "tel"), checkSame("pw", "pwCheck"), checkDuplicateId("id"), async(req, res, next) => {
    // signUp에서 값 가져옴
    const { id, pw, pwCheck, myName, birth, tel } = req.body

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };

   try{
       // DB통신
       const sql = "INSERT INTO account_schema.account(id, pw, name, birth, tel) VALUES($1, $2, $3, $4, $5)";
       const values = [id, pw, myName, birth, tel];

       await executeSQL(conn, sql, values);

        result.success = true,
        result.message = "회원가입 성공",
        result.data = {
            "id" : id,
            "pw" : pw,
            "name" : myName,
            "birth" : birth,
            "tel" : tel
        }

        res.locals.result = result;

        res.send(result)
    
      
   }catch(e){
       next(e)
   }
})


// 로그인 기능
router.post("/login", checkForm("id", "pw"), async (req, res, next) => {
    //logIn에서 값 가져옴
    const { id, pw } = req.body;

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };

    try{
        
        // DB 통신 - id, pw와 같은 사용자가 있는지
        const sql = "SELECT pk_idx, id, name, birth, tel FROM account_schema.account WHERE id = $1 AND pw = $2";
        const values = [id, pw];

        const dbResult = await executeSQL(conn, sql, values);

        if (!dbResult || dbResult.length === 0) {
            return next(new Error("일치하는 사용자가 없습니다."))
        }

        const user = dbResult[0];

        const uerIdx = user.pk_idx.toString()

        await redis.connect()

        const isDuplicate = await redis.hGet("nowUuid", uerIdx)

        if(isDuplicate){
            console.log("중복로그인입니다.")
            await redis.hSet("previousUuid", uerIdx, isDuplicate)
            await redis.hDel("nowUuid", uerIdx) // 이거 왜 삭제안됨?
        }

        await redis.hSet("nowUuid", uerIdx, uuid())
        console.log(uerIdx)
        // 1시간 유지
        await redis.expire("nowUuid", 3600)
        await redis.expire("previousUuid", 3600)

        result.success = true;
        result.message = "로그인에 성공했습니다.";
        result.data = dbResult

        res.locals.result = result;
        
        res.send(result)
    }catch(e){
        next(e)
    }finally{
        await redis.disconnect()
    }
})

// 로그아웃 기능 
router.delete("/logout", async (req, res, next) => {
    const result = {
        success: false,
        message: ''
    };

    try {
        // user redis 삭제
        await redis.connect()

        await redis.del("nowUuid")
        await redis.del("previousUuid")

        result.success = true;
        result.message = "로그아웃 되었습니다.";

        res.locals.result = result;

        res.send(result)

    } catch (e) {
        next(e)
    }finally{
        await redis.disconnect()
    }
    
});


// id 찾기 기능 - query string (특정한것 조회)
router.get("/find/id", checkForm("myName", "birth", "tel"), async(req, res, next) =>{
    //findId에서 값 가져옴
    const { myName, birth, tel } = req.query;

    // 프론트에 전달할 값 미리 만들기
    const result = {
       success : false,
       message : '',
       data : null
   };

    try{
        // DB 통신 (DB에서 가져온 값이 findId에서 가져온 값이랑 같은지 비교)
        const sql = "SELECT id FROM account_schema.account WHERE name = $1 AND birth = $2 AND tel = $3";
        const values = [myName, birth, tel];

        const dbResult = await executeSQL(conn, sql, values);

        if (!dbResult || dbResult.length === 0) {
            return next(new Error("일치하는 id가 없습니다."))
        }

        const id = dbResult[0].id;

        // id 찾기 결과가 true일시
        result.success = true;
        result.data = id; // db에서 가져온 id값
        result.message = `당신의 id는 ${id}`;

        res.locals.result = result;

        res.send(result)

        
    }catch (e) {
        next(e)
    }
   
})

// 비밀번호 찾기 - query string
router.get("/find/pw", checkForm("id", "myName", "birth", "tel"), async(req, res, next) => {
    // findPw에서 값 가져옴
    const { id, myName, birth, tel } = req.query;

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success: false,
        message: '',
        data: null
    };

    try {
        // DB 통신 - 해당 ID의 사용자의 비밀번호 조회
        const sql = "SELECT pw FROM account_schema.account WHERE id = $1 AND name = $2 AND birth = $3 AND tel = $4";
        const values = [id, myName, birth, tel];

        const dbResult = await executeSQL(conn, sql, values);

        if (!dbResult || dbResult.length === 0) {
            return next(new Error("일치하는 id가 없습니다."))
        }

        const pw = dbResult[0].pw;

        // 비밀번호 찾기 결과가 true일시
        result.success = true;
        result.data = pw; // DB에서 가져온 pw 값
        result.message = `당신의 비밀번호는 ${pw}입니다.`;

        res.locals.result = result;

        res.send(result)

    }catch (e) {
        next(e)
    }

})


// 내 정보 보기 기능
router.get("/", isLogin, async(req, res, next) => {
    const nowIdx = res.locals.nowIdx;
    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };

    try{
        await redis.connect()

        const sql = "SELECT id, name, birth, tel, admin FROM account_schema.account WHERE pk_idx = $1"
        const values = [nowIdx]
        const dbResult = await executeSQL(conn, sql, values);

        result.success = true;
        result.message = "내 정보 보기 성공";
        result.data = { dbResult };

        res.locals.result = result;
        res.send(result)
        
    }catch(e){
        next(e);
    }finally{
        await redis.disconnect();
    }
})

// 다른 사람 정보 보기 (path parameter)
router.get("/:idx", async(req, res, next) => {
    const otherIdx = req.params.idx;

    const result = {
        success: false,
        message: '',
        data: null
    };

    try {
        // DB 통신 - 해당 idx에 해당하는 사용자 정보 조회
        const sql = "SELECT id, name, birth, tel FROM account_schema.account WHERE pk_idx = $1";
        const values = [otherIdx];

        const dbResult = await executeSQL(conn, sql, values);

        if (!dbResult || dbResult.length === 0) {
            return next(new Error("해당 사용자 정보를 찾을 수 없습니다."))
        }
        
        const userInfo = dbResult[0];

        // 해당 사용자 정보 반환
        result.success = true;
        result.data = userInfo;
        result.message = `다른 사용자 정보(${otherIdx}) 조회 완료`;
        
        res.locals.result = result;

        res.send(result)

        } catch (e) {
            next(e)
        }
       
})

// 내 정보 수정 기능 - path parameter 
router.put("/", isLogin, checkForm("pw", "myName", "birth", "tel"), checkSame("pw", "pwCheck"), async(req, res, next) => {
    const nowIdx = res.locals.nowIdx;
    // modifyMyInform에서 수정할 정보 가져옴
    const { pw, pwCheck, myName, birth, tel} = req.body;

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };

   try{
        await redis.connect()

        // db 통신 -> db data를 수정할 정보로 바꿔줌
        const sql = `UPDATE account_schema.account
                     SET pw=$1, name=$2, birth=$3, tel=$4
                     WHERE pk_idx = $5`;
        const values = [pw, myName, birth, tel, nowIdx];

        await executeSQL(conn, sql, values);

        // 해당 사용자 정보 반환
        result.success = true;
        result.message = "정보 수정 완료";

        res.locals.result = result;

        res.send(result)
        }catch(e){
            next(e)
        }
        
})  

// 회원 탈퇴 기능 
router.delete("/", isLogin,  async(req, res, next) =>{
    const nowIdx = res.locals.nowIdx;
    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : ''
    };

    try {
        await redis.connect()
        await redis.del("nowUuid")
        await redis.del("previousUuid")
        
        // DB에서 사용자 정보 삭제
        const sql = "DELETE FROM account_schema.account WHERE pk_idx = $1";
        const values = [ nowIdx ]
        await executeSQL(conn, sql, values);

        // 삭제 성공시
        result.success = true;
        result.message = "회원 탈퇴 되었습니다.";

        res.locals.result = result;

        res.send(result)

    } catch (e) {
        next(e)
    }
});


module.exports = router