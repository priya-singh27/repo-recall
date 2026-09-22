import { useState } from 'react';
import {useAuth} from '../context/AuthContext';
import { Link } from "react-router";
import './auth.css';

export default function Signup () {
    const {signUp, loginWithGoogle } = useAuth();
    const [formData, setFormData] = useState({
        email:"",
        password:""
    });
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev)=>({
            ...prev,
            [name]: value
        }));
    }
    const handleSubmit=async (e)=> {
        e.preventDefault();
        const {data, error} = await signUp(formData.email, formData.password);
        if(error){
            console.log(error);

        }else{
            console.log(`Data: ${JSON.stringify(data)}`); 
        }
    }
    return(
    <div className="auth">
        <h1>Sign up</h1>
        <form className="auth__form" onSubmit={handleSubmit}>
           <label htmlFor='email'>Email</label>
           <input type="email" id='email' name='email' onChange={handleChange} value={formData.email}></input>

           <label htmlFor='password'>Password</label>
           <input type="password" id='password' name='password' onChange={handleChange} value={formData.password}></input>

           <button type="submit">Sign Up</button>
        </form>

        <div className="auth__alt">
            <button className="auth__secondary" type="button" onClick={()=> loginWithGoogle()}>Sign In With Google</button>
            <Link className="auth__link" to="/login">Login</Link>
        </div>
    </div>)
}