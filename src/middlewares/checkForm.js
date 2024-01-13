const { error } = require("console");
const { idPattern, pwPattern, namePattern, birthPattern, telPattern } = require("../config/regularExpression")

function checkForm(...values){
    return (req, res, next) => {
        try{
            values.forEach(value =>{
                let input;

                // req.body에서 값 확인
                if (req.body && req.body[value]) {
                    input = req.body[value];
                }
                // req.params에서 값 확인
                else if (req.params && req.params[value]) {
                    input = req.params[value];
                }
                // req.query에서 값 확인
                else if (req.query && req.query[value]) {
                    input = req.query[value];
                }
                
                let pattern;

                switch(value){
                    case "id" : pattern = idPattern; break;
                    case "pw" : pattern = pwPattern; break;
                    case "myName" : pattern = namePattern; break;
                    case "birth" : pattern = birthPattern; break;
                    case "tel" : pattern = telPattern; break;
                }

                if(!input || !pattern.test(input)){
                    return next(new Error(errorMessage))
                }
            })
            next();
            
        }catch(e){
                next(e);
            }
        }
    }


module.exports = {checkForm}