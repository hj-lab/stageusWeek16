
// 세션 체크
function isLogin(req, res, next){
    const userIdx = req.session.userIdx

    if(!userIdx || userIdx == "" || userIdx == undefined){
        return next(new Error("로그인 하십시오.")) 
    }

    next() // (/ , islogin -->에서 다음으로 넘어가도록 (req,res,next))
}

module.exports = { isLogin }