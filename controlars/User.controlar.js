const User= require("../Schema/User.module")
const createError=require('http-errors');
const bcrypt=require('bcrypt')
const createToken = require("../services/jwtwebtoken");
const { JWT_SECRET_KEY, SMTP_NAME, CLIENT_URL } = require("../config/secret");
const emailWithNODEmail = require("../Email/SMTPgmail");
const jwt=require('jsonwebtoken')

const getUserPagination=async(req,res,next)=>{
try {

const search= req.query.search || '';
const page= req.query.page || 1;
const limit= req.query.limit || 5;

const RegEx=new RegExp(".*" + search + ".*","i")

const filter={
isAdmin:{$ne:true},
$or:[
   { name:{$regex:RegEx} },
   { email:{$regex:RegEx} },
   { phone:{$regex:RegEx} }
]

}

const count=await User.find(filter).countDocuments()

const user=await User.find(filter)
.limit(limit)
.skip((page-1)* limit)

if (!user) throw createError(401,'User not found')


res.status(200).send({
    success:true,
    message:"user get successfull",
    regExpration:{
        user:user,
        curruentPage:page,
        totalPage:Math.ceil(count/limit),
        previusPage:page>1?page-1:null ,
        nextPage:page-1<Math.ceil(count/limit)?page+1:null
    }
})

} catch (error) {
    next(error)
}
}
const singleUserBYID=async(req,res,next)=>{
    try {
        
const id=req.params.id
const option={password:0}

const user=await User.findById({_id:id},option)

res.status(200).send({
    success:true,
    message:"single user get successfully",
    data:user
})

    } catch (error) {

        next(error)
    }
}

// const deleteBYID=async(req,res,next)=>{
//     try {
        
// const id=req.params.id
// const option={password:0}
// const model=User

// const user=await findBYid(model,id,option)

// const imagePath=user.image
//  imageDelete(imagePath)


// const isAdmin={ isAdmin:false};
// const Namemodel=User;
// await deleteByID(Namemodel,id,isAdmin,res)

//     } catch (error) {

//         next(error)
//     }
// }

const RegisterProcess=async(req,res,next)=>{
    try {
        const {name,password,email}=req.body;

        const existEmail=await User.exists({name:name})
        if (existEmail) {
            throw createError(409,'User alredy  with this name.please log in')
        }

const token = createToken({name,email,password},JWT_SECRET_KEY,"10m")

// const sendMail={
//     email, // list of receivers
//     subject: 'For Active your Register Account', // Subject line
//     html: `
//     <h2>Hello ${name}.</h2>
//     <p>please click here for 
//     <a href="${CLIENT_URL}/user/verify/register/${token}">
//     active your account</a></p> `, // html body
//   }

// try {
//   await  emailWithNODEmail(sendMail)
// } catch (error) {
//     next(createError(500,'faile to send varification email'))
//     return
// }

const Newuser= await new User(req.body)
await Newuser.save()

return res.status(200).send({
    success:true,
    message:`register successfull`,
    token:token,
    user:Newuser

})
    } catch (error) {

        next(error)
    }
}

const loginUser=async(req,res)=>{
    try {
        console.log(req.body);
        const user= await User.findOne({name:req.body.name})
        if (!user) {
            return res.status(200).send({
                success:false,
                message:"Name and Password Wrong"
            })
        }  
        
        
        const mathPassword=await bcrypt.compare(req.body.password ,user.password)
        if (!mathPassword) {
        return res.status(401).send({
                success:false,
                message:"Name and Password Wrong"
            })
        }  
        
       

        const token = jwt.sign({id:user._id },process.env.JWT_SECRET_KEY,{expiresIn:"1d"});
    
     res.status(200).send({
            success:true,
            message:'Login Successfull..!',
            data:user,
            token:token,
            userId:user._id
        })
        
    
    } catch (error) {
        res.status(500).send({
            success:false,
            message:"something went Wrong",
            error
           })
    }
    
    }
    

module.exports={
    getUserPagination,
    singleUserBYID,

    RegisterProcess,
    loginUser
}