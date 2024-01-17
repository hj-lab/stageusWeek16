const { executeSQL } = require("../modules/sql")

async function checkDuplicateLogin(req, res, next){
        const userId = req.body.id;

        // const sessionId = req.session.userId;

        try{

            res.on('finish', async() => {
                const sessionMap = res.locals.mySessionMap;

                if(!sessionMap){
                    console.error("sessionMap이 정의되지않음")
                }

                if(sessionMap.has(userId)){
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

        next();

        }catch(e){
            next(e)
        }
}


module.exports = { checkDuplicateLogin }