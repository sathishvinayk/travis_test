'use strict'

const  utils = require('lazy-cache')(require);
const Joi = utils('joi')();

module.exports = recon;

// Generic Email
const emailSch = Joi.object({
    // email: Joi.string().regex(/^(\s?[^\s,]+@[^\s,]+\.[^\s,]+\s?,)*(\s?[^\s,]+@[^\s,]+\.[^\s,]+)/g, 'email').required(),
    email: Joi.string(),
    subject: Joi.string().required(),
    message: Joi.string().max(4000).required(),
})
function recon(data, schema, cb){
    const buf = JSON.parse(data.toString())
    switch(schema){
        case 'emailGeneric':
            runner(buf, emailSch)
            break;
        default:
            console.log("Nothing here!")
    }
    function runner(buf, schema){
        const result = Joi.validate(buf, schema, {
            allowUnknown: false,
            abortEarly: false
        });
        if(result.error) {
            console.log("Error appeared here ", result.error)
            var err = result.error.name+' '+result.error.details[0].message; 
            cb(err); 
        } else {
            cb(null, result.value)    
        }
    }
}
