const idPattern = /^.{4,10}$/; //4~10글자
const pwPattern = /^(?=.*[a-zA-Z0-9])\S{8,15}$/; // 영문자, 숫자 포함 8~15자
const namePattern = /^.{2,5}$/; //2~5글자
const birthPattern = /\S+/; //빈값이 아닌 문자가 하나 이상 있는가
const telPattern = /^\d+$/; // 숫자만 포함
const dateTimePattern = /^(\d{4}-\d{2}-\d{2})(\d{2}:\d{2})$/; //YYYY-MM-DD AA:BB 년,월,일 시,분

module.exports = { idPattern, pwPattern, namePattern, birthPattern, telPattern, dateTimePattern }