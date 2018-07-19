'use strict'

const  utils = require('lazy-cache')(require);
const Joi = utils('joi')();

module.exports = recon;

const scheduleSch = Joi.object({
    message: Joi.string().min(1).max(160).required(),
    start_time: Joi.date().required(),
    end_time: Joi.date().required(),
    total_days: Joi.number().required(),
    gift_at: Joi.number().required(),
    gift_percent: Joi.number().required(),
    collection_discount: Joi.number().required(),
    coupon_code: Joi.number().min(1).required(),
    submitted_date: Joi.date().required(),
    approved_date: Joi.date().required(),
    customer_select_by: Joi.any().required(),
    gift_type: Joi.string().required(),
    postcode: Joi.string().regex(/^[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}$/i, 'postcode'),
    lastorder: Joi.number().min(1).max(1),
    portal: Joi.string()
});

const genSch = Joi.object({
    c_phone: Joi.string().required(),
    c_message: Joi.string().min(1).max(160).required()
})

function recon(data, schema, cb){
    const buf = JSON.parse(data.toString());
    switch(schema){
        case 'smsGeneric':
            runner(buf, genSch)
            break;
        case 'smsSchedule':
            runner(buf, scheduleSch)
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
