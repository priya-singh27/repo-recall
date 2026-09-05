const {createClient} = require('@supabase/supabase-js');
const dotenv = require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
)

const requireAuth = async (req, res, next) => {
    const auth_header = req.headers.authorization; 
    if(!auth_header?.startsWith('Bearer ')){
        return res.status(401).json({
            message:"Not logged in"
        });
    }

    const token = auth_header.slice(7);
    const {data, error} = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ message: 'Invalid or expired session' });
    }
    req.user=data.user;
    next();

}

module.exports={requireAuth}