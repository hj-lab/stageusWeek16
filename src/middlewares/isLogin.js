
// 세션 체크
function isLogin(req, res, next){
    const userIdx = req.session.userIdx
    // const userId = req.session.userId
    
    // const userSession = sessionMap.get(userId)
    // if(userSession != req.session){
    //     return next(new Error("중복 로그인 방지를 위해 현재 기기에서 로그아웃 되었습니다."))
    // }

    if(!userIdx || userIdx == "" || userIdx == undefined){
        return next(new Error("로그인 하십시오.")) 
    }

    next() // (/ , islogin -->에서 다음으로 넘어가도록 (req,res,next))
}

module.exports = { isLogin }