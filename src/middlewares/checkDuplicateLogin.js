const { executeSQL } = require("../modules/sql")

async function checkDuplicateLogin(req, res, next){
        const userId = req.body.id;

        const sessionId = req.session.userId;

        try{
            // sessionId가 이미 존재하고 현재 로그인 시도하는 id와 같다면
            if(sessionId == userId){

                res.on('finish', async() => {
                    const sessionMap = res.locals.mySessionMap;

                    if(!sessionMap){
                        console.error("sessionMap이 정의되지않음")
                    }

                    if(sessionMap.has(userId)){
                        console.log("중복로그인처리중")
                        
                        // 세션에 랜덤값 처음에 넣고
                        // 세션에 이전 랜덤값 넣기
                        // 현재 랜덤값과 이전 랜덤값이 다르면 중복 로그인으로 로그아웃된 상태

                        // map 덮어쓰기
                        sessionMap.set(userId, req.session)
                        // 세션삭제
                        await new Promise((resolve, reject) => {
                            req.session.destroy((err) => {
                                if (err) {
                                    reject(new Error("중복 로그인 세션 삭제 오류 발생"));
                                } else {
                                    resolve();
                                }
                            });
                        });


                    }
                })

            }

        next();

        }catch(e){
            next(e)
        }
}


module.exports = { checkDuplicateLogin }