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

// 댓글 쓰기, 읽기, 수정, 삭제

// 댓글 쓰기 기능
router.post("/", isLogin, checkBlank("content", "boardIdx"), async(req, res, next) =>{
    // 글 내용 받아오기
    const {content, boardIdx} = req.body

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : ''
    };

    try{
        // comment table에 등록
        const sql = `INSERT INTO comment_schema.comment (fk_board_idx, fk_account_idx, content)
                     VALUES ($1, $2, $3)`;
        const values = [boardIdx, req.session.userIdx, content];

        await executeSQL(conn, sql, values);
       
        // 댓글 추가 성공시
        result.success = true;
        result.message = "댓글 쓰기 성공";

        res.locals.result = result;

        res.send(result);
    
    }catch(e){
        next(e)
    }
   
})

// 댓글 읽기 기능
router.get("/", isLogin, checkBlank("boardIdx"), async(req, res, next) => {
    // 세션값 받아오기
    const sessionIdx = req.session.userIdx;
    // 읽고자 하는 댓글이 있는 게시글의 idx 가져옴
    const {boardIdx} = req.body;

    const result = {
        success : false,
        message : '',
        data : null
    };

    try{
        // db 통신 -> fk_board_idx = boardidx 인 댓글 다 가져오기
        const sql = "SELECT * FROM comment_schema.comment WHERE fk_board_idx = $1 ORDER BY create_at ASC";
        const values = [boardIdx];

        const dbResult = await executeSQL(conn, sql, values);
        if (!dbResult || dbResult.length === 0) {
            return next(new Error("댓글 읽기 실패"))
        }
        // 댓글 가져오기 성공시
        result.success = true;
        result.message = "댓글 읽기 성공";

        result.data = dbResult.map(comment => ({
            ...comment,
            isMine: comment.fk_account_idx === sessionIdx
        }));

        res.locals.result = result;

        res.send(result);
        
    }catch(e){
        next(e)
    }
   
})

// 댓글 수정 기능 - path parameter (댓글 번호 가져와서 그거 수정)
router.put("/:idx", isLogin, checkBlank("idx", "content"), async(req, res, next) => {
    // 수정하고자 하는 댓글의 pk_idx 가져옴
    const commentIdx = req.params.idx;
    const {content}  = req.body;
    const myIdx = req.session.userIdx;

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
        data : null
    };

    try{
        // db 통신 -> pk_idx에 해당하는 댓글 가져와서 content 수정
        const sql = `UPDATE comment_schema.comment
                     SET content = $1
                     WHERE pk_idx = $2 AND fk_account_idx = $3`;
        const values = [content, commentIdx, myIdx];

        // 본인이 아닌 사람이 수정을 하려는 경우는 극히 드물기 때문에 에러 메세지를 띄우지 않겠음.
        await executeSQL(conn, sql, values);
       
        // 댓글 수정 성공
        result.success = true;
        result.message = "댓글 수정 성공";

        res.locals.result = result;

        res.send(result);

    }catch(e){
        next(e)
    }

})

// 댓글 삭제 기능 - path parameter
router.delete("/:idx", isLogin, checkBlank("idx"), async(req, res, next) => {
    const commentIdx = req.params.idx;
    const myIdx = req.session.userIdx;

    // 프론트에 전달할 값 미리 만들기
    const result = {
        success : false,
        message : '',
    };

    try{
        // db 통신 -> commentnum_pk에 해당하는 댓글 삭제
        const sql = "DELETE FROM comment_schema.comment WHERE pk_idx = $1 AND fk_account_idx = $2";
        const values = [commentIdx, myIdx];
        
        await executeSQL(conn, sql, values);

        result.success = true;
        result.message = "댓글 삭제 성공";

        res.locals.result = result;
        
        res.send(result);
        
    }catch(e){
        next(e)
    }

})

module.exports = router