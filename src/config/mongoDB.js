const {MongoClient} = require("mongodb")

const uri = "mongodb://localhost:27017"; // MongoDB 연결 URI
const dbName = "logging"; // 데이터베이스
const client = new MongoClient(uri);

async function mongoDBConnect() {
    try {
        await client.connect();
        return client.db(dbName);
    } catch (err) {
        console.error("MongoDB 연결 오류 :", err);
    }
}

async function loggingMiddleware(req, res, next) {
    try {
            const db = await mongoDBConnect();
        
            const { ip, originalUrl, method } = req;
            const allInput = { ...req.body, ...req.params, ...req.query}
            const timestamp = new Date();
            

            let outputData = null;
            res.on('finish', async() => {
                    outputData = res.locals.result; // locals - 미들웨어간 데이터 전달하는데 사용되는 저장소 (요청<->응답 데이터 공유)
                    // 에러 발생했을 경우 기록
                    const error = res.locals.error;
                    if(error){
                        const errorLog = {
                            errorMessage: error.message,
                            stackTrace : error.stack,
                            loggingTime : new Date()
                        }
                        await db.collection('logs').insertOne(errorLog)
                        console.log("에러로그 mongoDB에 저장")
                    }

                    const log = {
                        ip: ip,
                        id: req.session.userId, // id
                        apiName : originalUrl,
                        restMethod : method,
                        input : allInput,
                        output : outputData, // API 실행 후에 설정할 수 있음
                        loggingTime: timestamp
                    };
                
                    // logging database -> logs collection에 로그 저장
                    await db.collection('logs').insertOne(log);
                    console.log('API 호출에 대한 로그가 MongoDB에 저장되었습니다.');
            });

     
    } catch (err) {
      console.error('로그 생성 중 오류:', err);
    }
  
    next();
  }


module.exports = { loggingMiddleware, mongoDBConnect }