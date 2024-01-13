// 빈칸 체크
function checkBlank(...contents) {
    return (req, res, next) => {
        try{
            contents.forEach(content => {
                let inputContent

                if (req.body && req.body[content]) {
                    inputContent = req.body[content];
                }
                // req.params에서 값 확인
                else if (req.params && req.params[content]) {
                    inputContent = req.params[content];
                }

                else if (req.query && req.query[content]) {
                    inputContent = req.query[content];
                }
                

                if (!inputContent || inputContent === "" || inputContent === undefined) {
                    return next(new Error(`${content}의 값이 없습니다.`));
                }
            })
            next() // 값이 존재할 때만 다음 미들웨어로 이동
        }catch(e){
            next(e)
        }
    }
}

module.exports = {checkBlank}