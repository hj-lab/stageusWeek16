const router = require("express").Router()
const { checkForm } = require("../middlewares/checkForm")
const { checkDuplicateId } = require("../middlewares/checkDuplicateId")
const { checkSame } = require("../middlewares/checkSame")
const { checkBlank } = require("../middlewares/checkBlank")
const { executeSQL } = require("../modules/sql")
const { isLogin } = require("../middlewares/isLogin")
const { isLogout } = require("../middlewares/isLogout")

const {loggingMiddleware} = require("../config/mongoDB")
// 로깅 미들웨어
router.use(loggingMiddleware);

// 각 파일에서 postgreSQL 연결 
const conn = require("../config/database");

// 게시글 쓰기, 읽기(전체, 개별), 수정, 삭제

// 게시글 쓰기 기능
router.post("/", isLogin, checkBlank("title", "content"), async(req, res, next) =>{
    // 글 내용 받아오기
    const {title, content} = req.body

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : ''
    };

    try{
        const userIdx = req.session.userIdx;

        // INSERT를 하면서 방금 insert한 것의 pk_idx (serial) 값 반환
        const sql = `INSERT INTO board_schema.board (fk_account_idx, title, content)
                     VALUES ($1, $2, $3)`;
        const values = [userIdx, title, content];

        await executeSQL(conn, sql, values);
       
        // 게시글 추가 성공시
        result.success = true;
        result.message = "게시글 쓰기 성공";

        res.locals.result = result;

        res.send(result);
    

    }catch(e){
        next(e)
    }

})

// 게시글 읽기 기능 (전체 목록 보는 board, 개별 post 보는 showpost)

// 전체 목록 보는 board
router.get("/all", isLogin, async(req,res,next) => {
    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };
    try{
        // db에서 전체 게시글 내용 가져옴
        const sql = "SELECT * FROM board_schema.board ORDER BY create_at ASC";
        const values = [];

        const dbResult = await executeSQL(conn, sql, values);
        if (!dbResult || dbResult.length === 0) {
            return next(new Error("게시글 전체 가져오기 실패"))
        }
        // 게시글 목록 가져오기 성공시
        result.success = true;
        result.data = dbResult;
        result.message = "게시글 목록 전체 가져오기 성공";

        res.locals.result = result;

        res.send(result);
        

    }catch(e){
        next(e)
    }
  
})

// 개별 post 보는 showPost - path parameter 
router.get("/:idx", isLogin, checkBlank("idx"), async(req, res, next) => {
    // 클릭한 게시글의 boardnum 가져옴
    const boardIdx = req.params.idx;
    const sessionIdx = req.session.userIdx;
    
    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null,
        isMine : false
    };

    try{
        const sql = "SELECT * FROM board_schema.board WHERE pk_idx = $1";
        const values = [boardIdx];

        const dbResult = await executeSQL(conn, sql, values);

        if (!dbResult || dbResult.length === 0) {
            return next(new Error("해당하는 게시글이 없습니다."))
        }

        // 조회된 게시글 반환
        const postData = dbResult[0];
        // 내꺼인지 아닌지
        postData.isMine = postData.fk_account_idx === sessionIdx

        result.success = true;
        result.message = "해당 게시글 조회 성공";
        result.data = postData;

        res.locals.result = result;

        res.send(result);
    

    }catch(e){
        next(e)
    }
   
})

// 게시글 수정 기능 - path parameter (게시글 번호 받아와서 그거 수정)
router.put("/:idx", isLogin, checkBlank("idx", "title", "content"), async(req, res, next) => {

    // modifyPost에서 수정할 title, content 가져옴
    const boardIdx = req.params.idx;
    const { title, content } = req.body;
    const myIdx = req.session.userIdx; 
    

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : ''
    };

    try{
        // DB 통신 -> table의 값 바꾸기
        const sql = `UPDATE board_schema.board
                     SET title = $1, content = $2
                     WHERE pk_idx = $3 AND fk_account_idx = $4`;
        const values = [title, content, boardIdx, myIdx]

        await executeSQL(conn, sql, values);

        result.success = true;
        result.message = "게시글 수정 성공";

        res.locals.result = result;

        res.send(result);
    
       
    }catch(e){
        next(e);
    }
   
})

// 게시글 삭제 기능 - path parameter 
router.delete("/:idx", isLogin, checkBlank("idx"), async(req, res, next) =>{
     // delete할 post 가져오기
     const boardIdx = req.params.idx;
     const myIdx = req.session.userIdx;

     // 프론트에 전달할 값 미리 만들기
     const result = {
         success : false,
         message : '',
     };

    try{
        // db 통신 -> id가 존재하고 id=accountid_fk이면  boardnum_pk 해당하는 게시글 삭제
        const sql = "DELETE FROM board_schema.board WHERE pk_idx = $1 AND fk_account_idx = $2";
        const values = [boardIdx, myIdx]; // 현재 로그인한 사용자의 userId로 비교
        
        await executeSQL(conn, sql, values);
        
        result.success = true;
        result.message = "게시글 삭제 성공";

        res.locals.result = result;

        res.send(result);
        

    }catch(e){
        next(e);
    }
   
})

module.exports = router