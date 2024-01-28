const redis = require("redis").createClient()

// 세션 체크
async function isLogin(req, res, next){
    try{
        await redis.connect()
        const previousUuidHash = await redis.hGetAll("previousUuid")
        const nowUuidHash = await redis.hGetAll("nowUuid")
        // hash의 key/value 분리해서 할당
        const previousIdx = Object.keys(previousUuidHash)[0]
        const previousUuid = previousUuidHash[previousIdx]

        const nowIdx = Object.keys(nowUuidHash)[0]
        const nowUuid = nowUuidHash[nowIdx]

        if(!nowUuid || nowUuid == "" || nowUuid == undefined){
            return next(new Error("로그인 하십시오.")) 
        }

        if(nowIdx == previousIdx && nowUuid != previousUuid){
            return next(new Error("중복 로그인 감지. 이전 기기에서 로그아웃 처리되었습니다."))
        }

        res.locals.nowIdx = nowIdx;

        next() // (/ , islogin -->에서 다음으로 넘어가도록 (req,res,next))
    }catch(e){
        next(e);
    }finally{
        await redis.disconnect()
    }
}

module.exports = { isLogin }