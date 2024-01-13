function authenticateAdmin(req, res, next){
    const auth = req.session.userAdmin

    try{
        if(!auth){
            return next(new Error("권한이 없습니다."))
        }

        next()
    }catch(e){
        next(e)
    }
}

module.exports = {authenticateAdmin}