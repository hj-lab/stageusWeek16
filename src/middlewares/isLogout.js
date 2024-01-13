// 세션 체크
function isLogout(req, res, next){
    const userIdx = req.session.userIdx
    if(userIdx){
        return next(new Error("이미 로그인 되어있습니다.")) 
    }
    next()
}

module.exports = { isLogout }