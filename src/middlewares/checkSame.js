function checkSame(value, valueCheck){
    return (req, res, next) => {
        const inputValue = req.body[value]
        const inputCheckValue = req.body[valueCheck]

        if(inputValue != inputCheckValue){
            return next(new Error("해당값과 확인값이 일치하지 않습니다.")) 
        }

        next()
    }
}

module.exports = { checkSame }